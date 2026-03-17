const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveApiBase = () => {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue) {
    return trimTrailingSlash(envValue);
  }

  return 'http://localhost:3001';
};

export const API_BASE_URL = resolveApiBase();

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL?.trim() ||
    (API_BASE_URL.startsWith('https')
      ? API_BASE_URL.replace(/^https/, 'wss')
      : API_BASE_URL.replace(/^http/, 'ws'))
);

export const FRONTEND_BASE_URL =
  import.meta.env.VITE_FRONTEND_BASE_URL?.trim() || window.location.origin;

export const GMAPS_KEY = import.meta.env.VITE_GMAPS_KEY?.trim() || '';
