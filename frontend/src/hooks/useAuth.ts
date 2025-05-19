import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      throw err;
    }
  }, []);

  return { user, setUser, loading, logout };
}