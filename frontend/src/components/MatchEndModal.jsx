import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, AlertTriangle, ArrowRight, RotateCcw, Home } from 'lucide-react';

export default function MatchEndModal({ matchState }) {
  const { socket, playerId, setCurrentRoom, setMatchState } = useSocket();
  const [loading, setLoading] = useState(false);

  if (!matchState) return null;

  const isDissolved = matchState.phase === 'match_dissolved';
  const isMatchEnded = matchState.phase === 'match_ended';
  const isGameOver = matchState.phase === 'game_over';

  if (!isDissolved && !isMatchEnded && !isGameOver) {
    return null;
  }

  const result = matchState.matchResult;
  const isOwner = matchState.players.find(p => p.playerId === playerId)?.isDealer || true;

  const handleNextDeal = () => {
    setLoading(true);
    socket.emit('match:next_deal', {
      roomCode: matchState.roomCode,
      playerId
    }, () => {
      setLoading(false);
    });
  };

  const handleReturnToLobby = () => {
    setMatchState(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 text-center">
        {/* CASE 1: MATCH DISSOLVED */}
        {isDissolved && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Match Dissolved!</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {matchState.dissolutionReason || 'The opposing team had 0 cards of the selected Trump suit from the start.'}
            </p>
            <div className="p-3 bg-slate-900 rounded-xl text-xs text-amber-300 border border-slate-700">
              Per Rule 4, no points are awarded or deducted. Hand is declared void.
            </div>

            <button
              onClick={handleNextDeal}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Redeal & Restart Match</span>
            </button>
          </div>
        )}

        {/* CASE 2: MATCH ENDED (8 Tricks completed) */}
        {isMatchEnded && result && (
          <div className="space-y-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl ${
              result.isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {result.isSuccess ? '🎉 Contract Fulfilled!' : '💥 Contract Defeated!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Team {result.contractTeam} bid <strong>{result.finalBid} Tricks</strong> and won <strong>{result.tricksWonByContract} Tricks</strong>.
              </p>
            </div>

            {/* Score Delta Banner */}
            <div className={`p-4 rounded-2xl border text-center ${
              result.isSuccess
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}>
              <div className="text-xs font-semibold uppercase">Points Awarded</div>
              <div className="text-2xl font-black mt-1">
                {result.pointsDelta > 0 ? `+${result.pointsDelta}` : result.pointsDelta} Points
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {result.isSuccess ? `+${result.finalBid} points to Team ${result.contractTeam}` : `-(2 × ${result.finalBid}) penalty to Team ${result.contractTeam}`}
              </div>
            </div>

            {/* Cumulative Totals */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 text-sm">
              <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30">
                <span className="text-xs text-blue-400 font-bold block">Team A Total</span>
                <span className="text-xl font-black text-white">{result.teamAScore} pts</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
                <span className="text-xs text-amber-400 font-bold block">Team B Total</span>
                <span className="text-xl font-black text-white">{result.teamBScore} pts</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleNextDeal}
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Next Deal (Rotate Dealer)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CASE 3: GAME OVER (Session Final Results) */}
        {isGameOver && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl">
              👑
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Game Session Concluded</h3>
              <p className="text-xs text-slate-400 mt-1">
                Final Cumulative Scores across all matches:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-700">
              <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-500/40">
                <span className="text-xs font-bold text-blue-300 uppercase block">Team A</span>
                <span className="text-3xl font-black text-white mt-1 block">
                  {matchState.teamScores?.teamA || 0}
                </span>
                <span className="text-[11px] text-slate-400">Slots 1 & 3</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40">
                <span className="text-xs font-bold text-amber-300 uppercase block">Team B</span>
                <span className="text-3xl font-black text-white mt-1 block">
                  {matchState.teamScores?.teamB || 0}
                </span>
                <span className="text-[11px] text-slate-400">Slots 2 & 4</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm font-bold text-amber-300">
              {matchState.teamScores?.teamA > matchState.teamScores?.teamB
                ? '🏆 Team A Wins the Session!'
                : matchState.teamScores?.teamB > matchState.teamScores?.teamA
                ? '🏆 Team B Wins the Session!'
                : '🤝 The Session Ends in a Draw!'}
            </div>

            <button
              onClick={handleReturnToLobby}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
