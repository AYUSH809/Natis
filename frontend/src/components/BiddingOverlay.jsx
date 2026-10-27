import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Shield, ArrowRight, XCircle } from 'lucide-react';

export default function BiddingOverlay({ matchState }) {
  const { socket, playerId } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!matchState || matchState.phase !== 'bidding') return null;

  const myPlayer = matchState.players.find(p => p.playerId === playerId);
  const currentBidder = matchState.players.find(p => p.slotNumber === matchState.currentBidderSlot);
  const highestBidder = matchState.players.find(p => p.slotNumber === matchState.highestBidderSlot);

  const isMyTurn = myPlayer && myPlayer.slotNumber === matchState.currentBidderSlot;
  const currentHighest = matchState.currentHighestBid; // null or 5..8

  // Calculate allowable bids (must be > currentHighest and <= 8)
  const minAllowed = currentHighest ? currentHighest + 1 : 5;
  const allowableBids = [];
  for (let b = minAllowed; b <= 8; b++) {
    allowableBids.push(b);
  }

  const handleBid = (bidVal) => {
    setError('');
    setLoading(true);
    socket.emit(
      'bid:place',
      {
        roomCode: matchState.roomCode,
        playerId,
        bid: bidVal
      },
      (res) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to place bid');
        }
      }
    );
  };

  return (
    <div className="bg-slate-800/95 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl max-w-xl mx-auto w-full backdrop-blur space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            🎯
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Bidding Phase</h3>
            <p className="text-[11px] text-slate-400">Total Tricks: 8 • Min Bid: 5 • Max Bid: 8</p>
          </div>
        </div>

        {/* Highest Bid To Beat */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Highest Bid</span>
          <div className="text-base sm:text-lg font-black text-amber-400">
            {currentHighest ? `${currentHighest} Tricks` : 'None (Min: 5)'}
          </div>
          {highestBidder && (
            <span className="text-[10px] text-slate-400">
              by {highestBidder.nickname} (P{highestBidder.slotNumber})
            </span>
          )}
        </div>
      </div>

      {/* Turn Status Alert */}
      <div className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
        isMyTurn
          ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
          : 'bg-slate-900 border-slate-700 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-indigo-400 animate-ping' : 'bg-slate-500'}`} />
          <span>
            {isMyTurn ? (
              <strong>Your Turn to Bid! Choose a bid or Pass.</strong>
            ) : (
              <span>Waiting for <strong>{currentBidder?.nickname || `Slot ${matchState.currentBidderSlot}`}</strong> to bid...</span>
            )}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Slot {matchState.currentBidderSlot}
        </span>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Interactive Controls if it is your turn */}
      {isMyTurn && (
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold text-slate-300">
            Select your bid:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allowableBids.map((b) => (
              <button
                key={b}
                disabled={loading}
                onClick={() => handleBid(b)}
                className="flex-1 min-w-[50px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50"
              >
                Bid {b}
              </button>
            ))}

            <button
              disabled={loading}
              onClick={() => handleBid('PASS')}
              className="flex-1 min-w-[70px] py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-bold text-sm transition-all border border-slate-600 disabled:opacity-50"
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {/* Status of All Players in Bidding */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/60">
        {matchState.players.map((p) => {
          const hasPassed = matchState.passedSlots.includes(p.slotNumber);
          const isHighest = matchState.highestBidderSlot === p.slotNumber;
          const isCurrent = matchState.currentBidderSlot === p.slotNumber;

          return (
            <div
              key={p.slotNumber}
              className={`p-2 rounded-lg border text-center text-[11px] ${
                isCurrent
                  ? 'bg-indigo-900/30 border-indigo-500'
                  : hasPassed
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div className="font-semibold truncate">{p.nickname}</div>
              <div className="text-[10px] text-slate-400">Slot {p.slotNumber}</div>
              <div className="mt-1 font-bold">
                {hasPassed ? (
                  <span className="text-rose-400">Passed</span>
                ) : isHighest ? (
                  <span className="text-amber-400">Bid {matchState.currentHighestBid}★</span>
                ) : isCurrent ? (
                  <span className="text-indigo-400">Thinking...</span>
                ) : (
                  <span className="text-slate-500">In Hand</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
