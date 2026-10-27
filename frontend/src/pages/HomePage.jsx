import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, LogIn, PlusCircle, History, Shield, Info, Bot, Sparkles } from 'lucide-react';
import NicknameModal from '../components/NicknameModal';

export default function HomePage() {
  const { socket, isConnected, nickname, playerId, setCurrentRoom } = useSocket();

  // Solo vs Computer state
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloError, setSoloError] = useState('');

  // Create Room state
  const [roomName, setRoomName] = useState('');
  const [mode, setMode] = useState(4);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join Room state
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Prompt nickname modal if missing
  const [showNickPrompt, setShowNickPrompt] = useState(false);

  // Match history state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(data))
      .catch(() => {});
  }, []);

  const handlePlaySolo = () => {
    if (!nickname) {
      setShowNickPrompt(true);
      return;
    }
    if (!socket || !isConnected) {
      setSoloError('Server not connected. Please wait a moment.');
      return;
    }

    setSoloLoading(true);
    setSoloError('');

    socket.emit(
      'room:create_solo',
      {
        nickname,
        playerId
      },
      (res) => {
        setSoloLoading(false);
        if (res.success) {
          setCurrentRoom(res.room);
        } else {
          setSoloError(res.error || 'Failed to start solo game');
        }
      }
    );
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!nickname) {
      setShowNickPrompt(true);
      return;
    }
    if (!socket || !isConnected) {
      setCreateError('Server not connected. Please wait a moment.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    socket.emit(
      'room:create',
      {
        nickname,
        mode,
        playerId,
        roomName: roomName.trim()
      },
      (res) => {
        setCreateLoading(false);
        if (res.success) {
          setCurrentRoom(res.room);
        } else {
          setCreateError(res.error || 'Failed to create room');
        }
      }
    );
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!nickname) {
      setShowNickPrompt(true);
      return;
    }
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Please enter a room code');
      return;
    }
    if (!socket || !isConnected) {
      setJoinError('Server not connected. Please wait a moment.');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    socket.emit(
      'room:join',
      {
        roomCode: cleanCode,
        nickname,
        playerId
      },
      (res) => {
        setJoinLoading(false);
        if (res.success) {
          setCurrentRoom(res.room);
        } else {
          setJoinError(res.error || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Tagline */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          NATIS Multiplayer & Solo Arena
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          A team trick-taking card game with hidden trick suits, a dynamic reveal mechanic,
          and the game-wide Joker.
        </p>
      </div>

      {/* Main Actions: 3 Options (Play with Computer, Create Room, Join Room) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* OPTION 1: PLAY WITH COMPUTER */}
        <div className="bg-slate-800 border-2 border-indigo-500/40 hover:border-indigo-500 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase font-black px-3 py-0.5 rounded-bl-lg tracking-wider">
            Quick Play
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Play vs Computer</h3>
                <p className="text-xs text-slate-400">Solo 4-Player Match</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Play immediately with <strong>1 AI Partner</strong> (Team A) against <strong>2 AI Opponents</strong> (Team B). No waiting for other players!
            </p>

            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1 mb-4">
              <div className="flex items-center justify-between">
                <span>• Team A:</span>
                <span className="text-blue-400 font-semibold">You + Bot Alpha</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Team B:</span>
                <span className="text-amber-400 font-semibold">Bot Beta + Bot Gamma</span>
              </div>
              <div>• Smart Bidding, Trump selection & Trick play</div>
            </div>

            {soloError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-3">
                {soloError}
              </div>
            )}
          </div>

          <button
            onClick={handlePlaySolo}
            disabled={soloLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            {soloLoading ? (
              <span>Starting Game...</span>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Play with Computer</span>
              </>
            )}
          </button>
        </div>

        {/* OPTION 2: CREATE MULTIPLAYER ROOM */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Room</h3>
                <p className="text-xs text-slate-400">Host for Friends</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Card Masters"
                  maxLength={24}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(4)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      mode === 4
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-xs">4 Players</div>
                    <div className="text-[10px] text-slate-500">2 vs 2</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode(6)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      mode === 6
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-xs">6 Players</div>
                    <div className="text-[10px] text-slate-500">3 vs 3</div>
                  </button>
                </div>
              </div>

              {createError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {createLoading ? <span>Creating...</span> : <span>Create Lobby</span>}
              </button>
            </form>
          </div>
        </div>

        {/* OPTION 3: JOIN ROOM */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Room</h3>
                <p className="text-xs text-slate-400">Enter with 6-char Code</p>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    if (joinError) setJoinError('');
                  }}
                  placeholder="e.g. K7P9M2"
                  maxLength={6}
                  className="w-full tracking-widest uppercase font-mono text-center text-base bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Odd seats (1, 3, 5) play for <strong>Team A</strong>.</p>
                <p>• Even seats (2, 4, 6) play for <strong>Team B</strong>.</p>
              </div>

              {joinError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {joinError}
                </div>
              )}

              <button
                type="submit"
                disabled={joinLoading}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {joinLoading ? <span>Joining...</span> : <span>Join Match</span>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Accordion / Collapsible Rules & Match History */}
      <div className="space-y-4">
        {/* Rules Accordion */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>NATIS Official Rule Summary (v1.1)</span>
            </div>
            <span className="text-xs text-slate-400">{showRules ? 'Hide ▲' : 'View ▼'}</span>
          </button>
          {showRules && (
            <div className="p-5 border-t border-slate-700/60 bg-slate-900/40 text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>Two-Phase Deal:</strong> 4 cards dealt first $\to$ Bidding (Min 5, Max 8) $\to$ Trump Selection $\to$ remaining 4 cards dealt (8 cards total).
              </p>
              <p>
                <strong>Joker Strategy:</strong> Cannot be played in Trick 1. Cannot lead/open in Tricks 2–7. Can be played when following at any time. Degrades to 7♠ in Trick 8.
              </p>
              <p>
                <strong>Reveal & Dissolution:</strong> Reveal Trump only when void in Base Suit. If opposing team got 0 trump cards from start, match is dissolved immediately.
              </p>
              <p>
                <strong>Scoring:</strong> Success = +bid points. Failure = -(2 * bid) points penalty.
              </p>
            </div>
          )}
        </div>

        {/* Rule 30: Match History */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Match History (Last 10 Completed Matches)</span>
            </div>
            <span className="text-xs text-slate-400">{showHistory ? 'Hide ▲' : 'View ▼'}</span>
          </button>
          {showHistory && (
            <div className="p-5 border-t border-slate-700/60 bg-slate-900/40 text-xs text-slate-300">
              {history.length === 0 ? (
                <p className="text-slate-500 italic py-2 text-center">
                  No completed matches recorded yet. Play a match to see history here!
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      <div>
                        <span className="font-bold text-white">Room {m.room_id}</span>
                        <span className="text-slate-400 ml-2">({m.mode} Players)</span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(m.created_at).toLocaleDateString()} at{' '}
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            m.winner_team === 'A'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          Winner: Team {m.winner_team}
                        </span>
                        <div className="text-[11px] text-slate-300 mt-1">
                          Team A: {m.team_a_score} | Team B: {m.team_b_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showNickPrompt && <NicknameModal onClose={() => setShowNickPrompt(false)} />}
    </div>
  );
}
