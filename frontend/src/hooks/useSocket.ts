import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';
import { getAuthToken } from '../config/authToken';

let sharedSocket: Socket | null = null;

const getSharedSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false
    });
  }

  sharedSocket.auth = {
    token: getAuthToken()
  };

  return sharedSocket;
};

export const syncSocketAuth = () => {
  if (sharedSocket) {
    sharedSocket.auth = {
      token: getAuthToken()
    };
  }
};

export const disconnectSharedSocket = () => {
  if (sharedSocket?.connected) {
    sharedSocket.disconnect();
  }
};

export const useSocket = (): Socket => {
  const socket = useMemo(() => getSharedSocket(), []);

  useEffect(() => {
    syncSocketAuth();

    const onConnect = () => console.log('Socket connected:', socket.id);
    const onDisconnect = (reason: string) => console.log('Socket disconnected:', reason);
    const onError = (error: Error) => console.error('Socket error:', error);
    const onReconnect = (attempt: number) =>
      console.log('Socket reconnected on attempt:', attempt);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.io.on('reconnect', onReconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket]);

  return socket;
};
