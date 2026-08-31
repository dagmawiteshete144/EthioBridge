import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  // Tracks the connection so the provider re-renders once the socket is ready.
  // Consumers subscribe with `on(event, handler)`; a fresh `on` identity after
  // connect makes those subscribers re-attach reliably even when their effect
  // ran before the socket finished connecting.
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (user) socket.emit('join', user._id);
    });
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const on = (event, handler) => {
    const socket = socketRef.current;
    if (socket) socket.on(event, handler);
    return () => { if (socket) socket.off(event, handler); };
  };

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, on, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
