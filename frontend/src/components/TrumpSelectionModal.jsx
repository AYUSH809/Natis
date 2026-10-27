import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Lock, Crown, ShieldAlert } from 'lucide-react';

export default function TrumpSelectionModal({ matchState }) {
  const { socket, playerId } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!matchState || matchState.phase !== 'trump_selection') return null;

  const contract = matchState.contract;
  const isContractPlayer = contract?.isContractPlayer;
  const contractPlayer = matchState.players.find(p => p.slotNumber === contract?.contractPlayerSlot);

  const suitOptions = [
    { key: 'HEARTS', label: 'Hearts', symbol: '♥', color: 'text-rose-500 border-rose-500/40 hover:bg-rose-500/10' },
    { key: 'DIAMONDS', label: 'Diamonds', symbol: '♦', color: 'text-rose-500 border-rose-500/40 hover:bg-rose-500/10' },
    { key: 'CLUBS', label: 'Clubs', symbol: '♣', color: 'text-slate-200 border-slate-600 hover:bg-slate-700' },
    { key: 'SPADES', label: 'Spades', symbol: '♠', color: 'text-slate-200 border-slate-600 hover:bg-slate-700' },
    { key: 'JOKER', label: 'Joker (No Trump)', symbol: '🃏', color: 'text-purple-400 border-purple-500/40 hover:bg-purple-500/10' }
  ];

  const handleSelectTrump = (suitKey) => {
    setError('');
    setLoading(true);
    socket.emit(
      'trump:select',
      {
        roomCode: matchState.roomCode,
        playerId,
        suit: suitKey
      },
      (res) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to select Trick Suit');
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl mb-2">
            👑
          </div>
          <h3 className="text-lg font-bold text-white">
            Contract Finalized!
          </h3>
          <p className="text-xs text-slate-300">
            <strong>{contractPlayer?.nickname}</strong> (Slot {contract?.contractPlayerSlot}) won the contract at{' '}
            <span className="text-amber-400 font-bold">{contract?.finalBid} Tricks</span> for{' '}
            <span className={contract?.contractTeam === 'A' ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>
              Team {contract?.contractTeam}
            </span>.
          </p>
        </div>

        {isContractPlayer ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Choose your hidden <strong>Trick Suit (Trump)</strong>. Only you will know this until revealed!
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {suitOptions.slice(0, 4).map((suit) => (
                <button
                  key={suit.key}
                  disabled={loading}
                  onClick={() => handleSelectTrump(suit.key)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${suit.color} disabled:opacity-50 active:scale-95`}
                >
                  <span className="text-xl">{suit.symbol}</span>
                  <span>{suit.label}</span>
                </button>
              ))}
            </div>

            {/* Joker / No Trump Option */}
            <button
              disabled={loading}
              onClick={() => handleSelectTrump('JOKER')}
              className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${suitOptions[4].color} disabled:opacity-50 active:scale-95`}
            >
              <span className="text-xl">{suitOptions[4].symbol}</span>
              <span>{suitOptions[4].label}</span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-700/60 text-center space-y-3">
            <div className="inline-block p-3 rounded-full bg-indigo-500/10 text-indigo-400 animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Waiting for {contractPlayer?.nickname} to select the hidden Trick Suit...
            </p>
            <p className="text-xs text-slate-400">
              Once selected, Phase 2 cards will be dealt to everyone!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
