import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getOrCreatePlayerId, getStoredNickname } from '../utils/playerSession';

const SocketContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [matchState, setMatchState] = useState(null);
  const [nickname, setNicknameState] = useState(getStoredNickname());
  const [playerId] = useState(getOrCreatePlayerId());
  const [systemAlert, setSystemAlert] = useState(null);

  useEffect(() => {
    const s = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('Connected to NATIS socket server:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    s.on('room:updated', (updatedRoom) => {
      console.log('Room updated:', updatedRoom);
      setCurrentRoom(updatedRoom);
      if (updatedRoom?.status === 'lobby') {
        setMatchState(null);
      }
    });

    s.on('match:state_updated', (updatedMatch) => {
      console.log('Match state updated:', updatedMatch);
      setMatchState(updatedMatch);
    });

    s.on('game:end_requested_notice', ({ message }) => {
      setSystemAlert(message);
    });

    s.on('room:kicked', ({ message }) => {
      setCurrentRoom(null);
      setMatchState(null);
      setSystemAlert(message || 'You were kicked from the room.');
    });

    s.on('game:started', ({ room }) => {
      if (room) setCurrentRoom(room);
      setSystemAlert('Match started! Phase 1 cards dealt.');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const setNickname = (name) => {
    setNicknameState(name);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        currentRoom,
        setCurrentRoom,
        matchState,
        setMatchState,
        nickname,
        setNickname,
        playerId,
        systemAlert,
        setSystemAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
