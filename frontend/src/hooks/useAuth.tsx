import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../config/env';
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
  withAuthHeader
} from '../config/authToken';
import { disconnectSharedSocket, syncSocketAuth } from './useSocket';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'customer' | 'restaurant';
  restaurant_id?: number;
  picture?: string | null;
}

interface AuthContextType {
  user: User | null;
  restaurant: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  restaurantLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restaurantLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  const withBase = (path: string) => new URL(path, API_BASE_URL).toString();

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get('token');
    if (urlToken) {
      setAuthToken(urlToken);
      setTokenState(urlToken);
      syncSocketAuth();
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    const storedToken = getAuthToken();
    if (storedToken) {
      setTokenState(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeToken = token || getAuthToken();
    if (!activeToken) {
      setUser(null);
      setRestaurant(null);
      setLoading(false);
      disconnectSharedSocket();
      return;
    }

    setAuthToken(activeToken);
    syncSocketAuth();

    const abortController = new AbortController();

    const fetchUser = async () => {
      try {
        const response = await fetch(withBase('/api/auth/me'), {
          headers: withAuthHeader(),
          credentials: 'include',
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = (await response.json()) as User;
        if (data.role === 'restaurant') {
          setRestaurant(data);
          setUser(null);
        } else {
          setUser(data);
          setRestaurant(null);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('Error fetching user:', error);
        clearAuthToken();
        disconnectSharedSocket();
        setTokenState(null);
        setUser(null);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();

    return () => {
      abortController.abort();
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await fetch(withBase('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Credenciales invalidas'));
    }

    const data = await response.json();
    const nextUser = (data.user || data) as User;
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      syncSocketAuth();
    }

    setUser(nextUser);
    setRestaurant(null);
  };

  const restaurantLogin = async (email: string, password: string) => {
    const response = await fetch(withBase('/api/auth/restaurant/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Credenciales invalidas'));
    }

    const data = await response.json();
    const nextRestaurant = (data.user || data) as User;
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      syncSocketAuth();
    }

    setRestaurant(nextRestaurant);
    setUser(null);
  };

  const clearClientAuth = () => {
    clearAuthToken();
    disconnectSharedSocket();
    setTokenState(null);
    setUser(null);
    setRestaurant(null);
  };

  const logout = async () => {
    try {
      await fetch(withBase('/api/auth/logout'), {
        method: 'POST',
        headers: withAuthHeader(),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Error during logout request', error);
    } finally {
      clearClientAuth();
    }
  };

  const restaurantLogout = async () => {
    try {
      await fetch(withBase('/api/auth/logout'), {
        method: 'POST',
        headers: withAuthHeader(),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Error during restaurant logout request', error);
    } finally {
      clearClientAuth();
    }
  };

  const value = {
    user,
    restaurant,
    loading,
    login,
    restaurantLogin,
    logout,
    restaurantLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
