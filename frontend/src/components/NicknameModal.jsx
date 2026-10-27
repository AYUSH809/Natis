import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { setStoredNickname } from '../utils/playerSession';
import { X, Check } from 'lucide-react';

export default function NicknameModal({ onClose }) {
  const { nickname, setNickname } = useSocket();
  const [val, setVal] = useState(nickname || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = val.trim();
    if (!clean) {
      setError('Please enter a nickname');
      return;
    }
    if (clean.length < 2 || clean.length > 15) {
      setError('Nickname must be between 2 and 15 characters');
      return;
    }
    setStoredNickname(clean);
    setNickname(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Player Nickname</h3>
          {nickname && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter your display name
            </label>
            <input
              type="text"
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. AcePlayer"
              maxLength={15}
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {nickname && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
