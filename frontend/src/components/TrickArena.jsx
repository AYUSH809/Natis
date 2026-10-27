import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import CardView from './CardView';
import { Eye, Shield, AlertCircle, Award, Trophy } from 'lucide-react';

export default function TrickArena({ matchState }) {
  const { socket, playerId } = useSocket();
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState('');
  const [isDrawingTowardsWinner, setIsDrawingTowardsWinner] = useState(false);

  if (!matchState || matchState.phase !== 'trick_play' || !matchState.currentTrick) {
    return null;
  }

  const trick = matchState.currentTrick;
  const myPlayer = matchState.players.find(p => p.playerId === playerId);
  const isMyTurn = myPlayer && myPlayer.slotNumber === trick.turnSlot;
  const contract = matchState.contract;

  // 1-2 second pause + draw animation towards round winner
  useEffect(() => {
    if (trick?.isResolving && trick?.winner) {
      // Wait 1.1s so players can clearly inspect all 4 cards and see the winner announcement
      const timer = setTimeout(() => {
        setIsDrawingTowardsWinner(true);
      }, 1100);

      return () => clearTimeout(timer);
    } else {
      setIsDrawingTowardsWinner(false);
    }
  }, [trick?.isResolving, trick?.winner]);

  // Calculate direction for cards to fly towards the winning player's position
  const getFlightTransformClass = () => {
    if (!isDrawingTowardsWinner || !trick?.winner) return '';

    const winnerSlot = trick.winner.slotNumber;
    const mySlot = myPlayer?.slotNumber || 1;

    // Winner is South (You) -> fly down
    if (winnerSlot === mySlot) {
      return 'translate-y-48 scale-25 opacity-0';
    }

    // Winner is North (Partner) -> fly up
    const isPartner = (winnerSlot % 2) === (mySlot % 2);
    if (isPartner) {
      return '-translate-y-48 scale-25 opacity-0';
    }

    // Winner is East (Right) -> fly right
    const nextSlot = (mySlot % matchState.mode) + 1;
    if (winnerSlot === nextSlot) {
      return 'translate-x-52 scale-25 opacity-0';
    } else {
      // Winner is West (Left) -> fly left
      return '-translate-x-52 scale-25 opacity-0';
    }
  };

  // Check if player can reveal trump
  const myHand = matchState.myHand || [];
  const baseSuit = trick.baseSuit;
  const isVoidInBase = baseSuit ? !myHand.some(c => !c.isJoker && c.suit === baseSuit) : false;
  const canRevealTrump = isMyTurn && !contract?.isTrumpRevealed && baseSuit && isVoidInBase;

  const handleRevealTrump = () => {
    setRevealError('');
    setRevealLoading(true);
    socket.emit(
      'trump:reveal',
      {
        roomCode: matchState.roomCode,
        playerId
      },
      (res) => {
        setRevealLoading(false);
        if (!res.success) {
          setRevealError(res.error || 'Failed to reveal trump');
        }
      }
    );
  };

  const currentTurnPlayer = matchState.players.find(p => p.slotNumber === trick.turnSlot);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between space-y-3">
      {/* Trick Status & Round Header */}
      <div className="flex items-center justify-between w-full px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">
            Round / Trick <span className="text-white font-mono text-sm">{trick.trickNumber}</span> of 8
          </span>
          {trick.baseSuit && (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
              Base Suit: <strong className="text-amber-400">{trick.baseSuit}</strong>
            </span>
          )}
        </div>

        {/* Tricks Won count */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-blue-400">Team A: <strong>{matchState.tricksWon?.teamA || 0}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">Team B: <strong>{matchState.tricksWon?.teamB || 0}</strong></span>
        </div>
      </div>

      {/* Main Table Felt Arena for Cards Played */}
      <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl relative min-h-[190px] flex flex-col items-center justify-center overflow-hidden">
        {/* Winner Announcement Banner during 1-2s pause */}
        {trick.isResolving && trick.winner && (
          <div className="mb-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-md">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Round Won by <strong>{trick.winner.nickname}</strong> (Team {trick.winner.team})!
            </span>
          </div>
        )}

        {trick.cardsPlayed.length === 0 ? (
          <div className="text-center space-y-1 text-slate-400">
            <div className="text-xs">
              Waiting for <strong>{currentTurnPlayer?.nickname}</strong> (Slot {trick.turnSlot}) to open the trick...
            </div>
            <div className="text-[11px] text-slate-500 italic">
              {trick.trickNumber === 1 ? 'Rule 5: Joker cannot be played in Trick 1' : 'Rule 5: Joker cannot open to establish Base Suit'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center justify-center w-full">
            {trick.cardsPlayed.map((play, i) => {
              const isWinningCard = trick.isResolving && trick.winner?.slotNumber === play.slotNumber;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 transition-all duration-700 ease-in-out ${getFlightTransformClass()}`}
                >
                  <div className={`relative ${isWinningCard ? 'ring-4 ring-amber-400 rounded-lg shadow-2xl scale-105' : ''}`}>
                    <CardView card={play.card} size="md" />
                    {isWinningCard && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow">
                        ★ WIN
                      </div>
                    )}
                  </div>

                  <div className="text-center leading-tight mt-1">
                    <span className="font-bold text-xs text-white block truncate max-w-[80px]">
                      {play.nickname}
                    </span>
                    <span className={`text-[10px] px-1 rounded ${
                      play.team === 'A' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      Team {play.team} (P{play.slotNumber})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Previous Winner Indicator if applicable */}
        {trick.lastWinner && trick.cardsPlayed.length === 0 && !trick.isResolving && (
          <div className="absolute top-2 right-2 text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Prev Winner: {trick.lastWinner.nickname}</span>
          </div>
        )}
      </div>

      {/* Turn Action / Reveal Trump Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full px-1">
        <div className="text-xs">
          {trick.isResolving ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Collecting trick cards...
            </span>
          ) : isMyTurn ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Your turn! Click a highlighted card in your hand to play.
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Waiting for <strong>{currentTurnPlayer?.nickname}</strong> to play...
            </span>
          )}
        </div>

        {/* Reveal Trump Button (Enabled only when void in Base Suit) */}
        {!contract?.isTrumpRevealed && !trick.isResolving && (
          <button
            onClick={handleRevealTrump}
            disabled={!canRevealTrump || revealLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              canRevealTrump
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md cursor-pointer animate-bounce'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
            }`}
            title={canRevealTrump ? 'Click to reveal hidden Trump!' : 'Can only reveal when void in Base Suit on your turn'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{revealLoading ? 'Revealing...' : 'Reveal Trump'}</span>
          </button>
        )}
      </div>

      {revealError && (
        <div className="w-full p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {revealError}
        </div>
      )}
    </div>
  );
}
