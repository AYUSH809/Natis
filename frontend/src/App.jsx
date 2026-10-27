import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GameTable from './components/GameTable';
import { AlertCircle, X } from 'lucide-react';

function AppContent() {
  const { currentRoom, matchState, systemAlert, setSystemAlert } = useSocket();

  const isPlaying = Boolean(matchState || currentRoom?.status === 'playing');

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Navbar />

      {/* System Notification / Alert banner */}
      {systemAlert && (
        <div className="bg-indigo-600/90 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{systemAlert}</span>
          </div>
          <button
            onClick={() => setSystemAlert(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View: GameTable vs LobbyPage vs HomePage */}
      <main className="flex-1">
        {isPlaying ? (
          <GameTable matchState={matchState} />
        ) : currentRoom ? (
          <LobbyPage />
        ) : (
          <HomePage />
        )}
      </main>

      {/* Clean, Simple Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        NATIS Card Game • v1.1 • Two-Phase Engine & Official Rules
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
