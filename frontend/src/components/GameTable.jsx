import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import HandView from './HandView';
import BiddingOverlay from './BiddingOverlay';
import TrumpSelectionModal from './TrumpSelectionModal';
import TrickArena from './TrickArena';
import MatchEndModal from './MatchEndModal';
import { Crown, Lock, Unlock, AlertTriangle, StopCircle, Bot } from 'lucide-react';

export default function GameTable({ matchState }) {
  const { socket, playerId } = useSocket();
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [playError, setPlayError] = useState('');

  if (!matchState) return null;

  const myPlayer = matchState.players.find(p => p.playerId === playerId);
  const otherPlayers = matchState.players.filter(p => p.playerId !== playerId);
  const contract = matchState.contract;
  const isMyTurn = myPlayer && matchState.currentTrick && myPlayer.slotNumber === matchState.currentTrick.turnSlot;

  const handleEndGame = () => {
    socket.emit('game:request_end', {
      roomCode: matchState.roomCode,
      playerId
    });
    setShowEndConfirm(false);
  };

  const handlePlayCard = (card) => {
    setPlayError('');
    socket.emit(
      'card:play',
      {
        roomCode: matchState.roomCode,
        playerId,
        cardId: card.id
      },
      (res) => {
        if (!res.success) {
          setPlayError(res.error || 'Illegal move');
        }
      }
    );
  };

  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'HEARTS': return '♥';
      case 'DIAMONDS': return '♦';
      case 'CLUBS': return '♣';
      case 'SPADES': return '♠';
      case 'JOKER': return '🃏';
      default: return '?';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 flex flex-col justify-between min-h-[calc(100vh-80px)] space-y-4">
      {/* Top Bar: Scores, Dealer, Trump, and End Game CTA */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Cumulative Scoreboard */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/40">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="font-bold text-xs sm:text-sm text-blue-300">Team A:</span>
            <span className="font-black text-sm sm:text-base text-white">
              {matchState.teamScores?.teamA || 0}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-bold text-xs sm:text-sm text-amber-300">Team B:</span>
            <span className="font-black text-sm sm:text-base text-white">
              {matchState.teamScores?.teamB || 0}
            </span>
          </div>
        </div>

        {/* Center Info: Virtual Dealer & Contract */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {/* Virtual Dealer Token */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 font-medium">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Dealer: <strong>P{matchState.dealerSlot}</strong></span>
          </div>

          {/* Contract / Trump Badge */}
          {contract ? (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">Contract:</span>
              <span className="font-bold text-amber-400">{contract.finalBid} Tricks</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                contract.contractTeam === 'A' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Team {contract.contractTeam}
              </span>

              {/* Trump Status */}
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-700 font-bold">
                {contract.trickSuit === 'HIDDEN' ? (
                  <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Lock className="w-3 h-3 text-slate-500" /> Trump: Hidden
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs">
                    <Unlock className="w-3 h-3" />
                    <span>{getSuitSymbol(contract.trickSuit)} {contract.trickSuit}</span>
                    {contract.isContractPlayer && (
                      <span className="text-[10px] text-indigo-300 font-normal">(Your Secret)</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400">
              Phase: <strong>Bidding</strong>
            </div>
          )}
        </div>

        {/* End Game CTA (Rule 7) */}
        <div className="flex items-center gap-2">
          {matchState.endGameRequested ? (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold animate-pulse">
              Final Match (Ending after this)
            </span>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all font-medium"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>End Game</span>
            </button>
          )}
        </div>
      </div>

      {playError && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
          {playError}
        </div>
      )}

      {/* Main Table Arena */}
      <div className="relative bg-slate-950/60 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-inner flex-1 flex flex-col justify-between min-h-[380px]">
        {/* Opponents / Teammates row at top */}
        <div className="flex justify-around items-center gap-2 flex-wrap">
          {otherPlayers.map((p) => {
            const isTeamA = p.team === 'A';
            const isDealer = p.isDealer;
            const isTurn = p.isCurrentBidder || p.isCurrentTurn;

            return (
              <div
                key={p.slotNumber}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all min-w-[100px] sm:min-w-[130px] ${
                  isTurn
                    ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg'
                    : isTeamA
                    ? 'bg-blue-950/30 border-blue-500/30'
                    : 'bg-amber-950/30 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {p.isBot && <Bot className="w-3.5 h-3.5 text-indigo-400" title="AI Bot" />}
                  <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[100px]">
                    {p.nickname}
                  </span>
                  {isDealer && <Crown className="w-3 h-3 text-amber-400" title="Dealer" />}
                </div>

                <div className="flex items-center justify-center gap-1 text-[10px]">
                  <span className={`px-1.5 py-0.2 rounded font-semibold ${
                    isTeamA ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    Slot {p.slotNumber} (Team {p.team})
                  </span>
                </div>

                {/* Face down cards representation */}
                <div className="flex justify-center items-center gap-0.5 mt-2">
                  {Array.from({ length: Math.min(p.cardCount, 8) }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-2.5 h-4 sm:w-3 sm:h-5 rounded-[2px] bg-indigo-900 border border-indigo-700/60 shadow-xs"
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {p.cardCount} cards
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Stage: Bidding Overlay OR Trick Arena */}
        <div className="my-auto py-3 flex justify-center items-center w-full">
          {matchState.phase === 'bidding' ? (
            <BiddingOverlay matchState={matchState} />
          ) : matchState.phase === 'trick_play' ? (
            <TrickArena matchState={matchState} />
          ) : null}
        </div>

        {/* Bottom Area: Your Player Info + Your Hand */}
        <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3 sm:p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{myPlayer?.nickname} (You)</span>
              <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                myPlayer?.team === 'A' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Slot #{myPlayer?.slotNumber} • Team {myPlayer?.team}
              </span>
              {myPlayer?.isDealer && (
                <span className="flex items-center gap-1 text-amber-400 font-semibold text-[10px]">
                  <Crown className="w-3 h-3" /> Dealer
                </span>
              )}
            </div>

            <span className="text-slate-400 text-[11px]">
              {matchState.myHand?.length || 0} Cards in Hand
            </span>
          </div>

          {/* Cards Hand */}
          <HandView
            hand={matchState.myHand || []}
            phase={matchState.phase}
            currentTrick={matchState.currentTrick}
            isMyTurn={isMyTurn}
            onPlayCard={handlePlayCard}
          />
        </div>
      </div>

      {/* Trump Selection Modal Overlay */}
      {matchState.phase === 'trump_selection' && (
        <TrumpSelectionModal matchState={matchState} />
      )}

      {/* Match Result / End Modal */}
      <MatchEndModal matchState={matchState} />

      {/* Confirm End Game Dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">End Game Session?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              According to Rule 7, requesting to End Game will flag this ongoing match as the <strong>final match</strong>. Once this match finishes, the game session will end and final team scores will be displayed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndGame}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Confirm End Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
