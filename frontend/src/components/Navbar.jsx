import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { User, Wifi, WifiOff, Edit3 } from 'lucide-react';
import NicknameModal from './NicknameModal';

export default function Navbar() {
  const { isConnected, nickname } = useSocket();
  const [showNickModal, setShowNickModal] = useState(false);

  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-sm">
            N
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">NATIS</h1>
            <p className="text-xs text-slate-400 font-medium -mt-1">Card Game v1.0</p>
          </div>
        </div>

        {/* Right side: Nickname & Connection Status */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/60">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-medium">Server Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 font-medium">Connecting...</span>
              </>
            )}
          </div>

          {/* User Profile / Nickname */}
          <button
            onClick={() => setShowNickModal(true)}
            className="flex items-center gap-2 bg-slate-700/70 hover:bg-slate-700 border border-slate-600/70 text-slate-200 px-3 py-1.5 rounded-lg text-sm transition-all"
            title="Change nickname"
          >
            <User className="w-4 h-4 text-indigo-400" />
            <span className="font-medium max-w-[120px] truncate">
              {nickname || 'Set Nickname'}
            </span>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </div>

      {showNickModal && <NicknameModal onClose={() => setShowNickModal(false)} />}
    </header>
  );
}
