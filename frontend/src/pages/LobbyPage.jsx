import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
  Copy,
  Check,
  Crown,
  UserCheck,
  UserX,
  Play,
  ArrowLeft,
  Users,
  MessageSquare,
  Send,
  AlertCircle
} from 'lucide-react';

export default function LobbyPage() {
  const { socket, currentRoom, setCurrentRoom, playerId, nickname, setSystemAlert } = useSocket();
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const chatBottomRef = useRef(null);

  const isOwner = currentRoom?.ownerId === playerId;
  const currentSlot = currentRoom?.players.find((p) => p.playerId === playerId)?.slotNumber;
  const isCurrentPlayerReady = currentRoom?.players.find((p) => p.playerId === playerId)?.isReady;

  useEffect(() => {
    if (!socket) return;

    const handleChat = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on('room:chat_received', handleChat);

    return () => {
      socket.off('room:chat_received', handleChat);
    };
  }, [socket]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!currentRoom) return null;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    socket.emit('room:leave', { playerId }, () => {
      setCurrentRoom(null);
    });
  };

  const handleSelectSlot = (slotNumber) => {
    setActionError('');
    socket.emit(
      'room:select_slot',
      {
        roomCode: currentRoom.id,
        playerId,
        targetSlot: slotNumber
      },
      (res) => {
        if (!res.success) setActionError(res.error);
      }
    );
  };

  const handleToggleReady = () => {
    setActionError('');
    socket.emit(
      'room:toggle_ready',
      {
        roomCode: currentRoom.id,
        playerId
      },
      (res) => {
        if (!res.success) setActionError(res.error);
      }
    );
  };

  const handleChangeMode = (newMode) => {
    setActionError('');
    socket.emit(
      'room:change_mode',
      {
        roomCode: currentRoom.id,
        playerId,
        newMode
      },
      (res) => {
        if (!res.success) setActionError(res.error);
      }
    );
  };

  const handleKickPlayer = (targetPlayerId, targetName) => {
    if (!confirm(`Are you sure you want to remove ${targetName} from the room?`)) return;
    setActionError('');
    socket.emit(
      'room:kick',
      {
        roomCode: currentRoom.id,
        ownerPlayerId: playerId,
        targetPlayerId
      },
      (res) => {
        if (!res.success) setActionError(res.error);
      }
    );
  };

  const handleStartGame = () => {
    setActionError('');
    socket.emit(
      'room:start_game',
      {
        roomCode: currentRoom.id,
        playerId
      },
      (res) => {
        if (!res.success) {
          setActionError(res.error);
        }
      }
    );
  };

  const sendChat = (text) => {
    const msg = text || inputMsg;
    if (!msg.trim()) return;
    socket.emit('room:chat_message', {
      roomCode: currentRoom.id,
      senderName: nickname || 'Player',
      message: msg.trim()
    });
    if (!text) setInputMsg('');
  };

  // Check start readiness
  const isFull = currentRoom.players.length === currentRoom.mode;
  const allReady = currentRoom.players.every((p) => p.isReady);
  const canStart = isFull && allReady && isOwner;

  // Split slots for Team A (1, 3, 5) and Team B (2, 4, 6)
  const teamASlots = currentRoom.mode === 6 ? [1, 3, 5] : [1, 3];
  const teamBSlots = currentRoom.mode === 6 ? [2, 4, 6] : [2, 4];

  const getPlayerInSlot = (slot) => currentRoom.players.find((p) => p.slotNumber === slot);

  const quickPresets = [
    '👋 Ready to play!',
    '🔥 Team A for the win!',
    '⚡ Team B taking this!',
    '🃏 Watch out for the Joker!',
    '🔄 Can we swap seats?'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Leave Room"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{currentRoom.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                {currentRoom.mode} Players
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">Room Code:</span>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono font-bold text-slate-200 transition-colors"
                title="Click to copy room code"
              >
                <span>{currentRoom.id}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {copied && <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>}
            </div>
          </div>
        </div>

        {/* Action button: Ready or Start */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleReady}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${
              isCurrentPlayerReady
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
            }`}
          >
            {isCurrentPlayerReady ? '✓ You Are Ready' : 'Click to Ready Up'}
          </button>

          {isOwner && (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${
                canStart
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer animate-pulse'
                  : 'bg-slate-700/60 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Match</span>
            </button>
          )}
        </div>
      </div>

      {/* Owner controls banner if applicable */}
      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Host Controls:</strong> Configure match settings and start when everyone is ready.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mode:</span>
            <button
              onClick={() => handleChangeMode(4)}
              className={`px-2.5 py-1 rounded border font-semibold ${
                currentRoom.mode === 4
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              4 Players (2v2)
            </button>
            <button
              onClick={() => handleChangeMode(6)}
              className={`px-2.5 py-1 rounded border font-semibold ${
                currentRoom.mode === 6
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              6 Players (3v3)
            </button>
          </div>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Status Alert for match launch readiness */}
      {!canStart && isOwner && (
        <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {!isFull
              ? `Waiting for ${currentRoom.mode - currentRoom.players.length} more player(s) to fill the room.`
              : 'Waiting for all players to set status to Ready.'}
          </span>
        </div>
      )}

      {/* TEAMS GRID: Team A vs Team B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TEAM A */}
        <div className="bg-slate-800/90 border border-blue-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="text-lg font-bold text-blue-400">Team A</h3>
            </div>
            <span className="text-xs text-slate-400">
              Odd Slots ({teamASlots.join(', ')})
            </span>
          </div>

          <div className="space-y-3">
            {teamASlots.map((slotNum) => {
              const player = getPlayerInSlot(slotNum);
              const isYou = player?.playerId === playerId;

              return (
                <div
                  key={slotNum}
                  className={`p-3.5 rounded-xl border transition-all ${
                    player
                      ? isYou
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                        : 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/40 border-dashed border-slate-700 hover:border-blue-500/50 cursor-pointer'
                  }`}
                  onClick={() => !player && handleSelectSlot(slotNum)}
                >
                  {player ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-xs">
                          P{slotNum}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {player.nickname}
                            </span>
                            {player.playerId === currentRoom.ownerId && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" title="Room Host" />
                            )}
                            {isYou && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">Slot #{slotNum}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {player.isReady ? (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            Waiting
                          </span>
                        )}

                        {isOwner && !isYou && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKickPlayer(player.playerId, player.nickname);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Kick player"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-400 hover:text-blue-300 py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xs font-mono">
                          P{slotNum}
                        </div>
                        <span className="text-xs font-medium">Empty Slot #{slotNum}</span>
                      </div>
                      <span className="text-xs text-blue-400 font-semibold underline">
                        Switch Here
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM B */}
        <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-lg font-bold text-amber-400">Team B</h3>
            </div>
            <span className="text-xs text-slate-400">
              Even Slots ({teamBSlots.join(', ')})
            </span>
          </div>

          <div className="space-y-3">
            {teamBSlots.map((slotNum) => {
              const player = getPlayerInSlot(slotNum);
              const isYou = player?.playerId === playerId;

              return (
                <div
                  key={slotNum}
                  className={`p-3.5 rounded-xl border transition-all ${
                    player
                      ? isYou
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-sm'
                        : 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/40 border-dashed border-slate-700 hover:border-amber-500/50 cursor-pointer'
                  }`}
                  onClick={() => !player && handleSelectSlot(slotNum)}
                >
                  {player ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-xs">
                          P{slotNum}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {player.nickname}
                            </span>
                            {player.playerId === currentRoom.ownerId && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" title="Room Host" />
                            )}
                            {isYou && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">Slot #{slotNum}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {player.isReady ? (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            Waiting
                          </span>
                        )}

                        {isOwner && !isYou && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKickPlayer(player.playerId, player.nickname);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Kick player"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-400 hover:text-amber-300 py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xs font-mono">
                          P{slotNum}
                        </div>
                        <span className="text-xs font-medium">Empty Slot #{slotNum}</span>
                      </div>
                      <span className="text-xs text-amber-400 font-semibold underline">
                        Switch Here
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOBBY CHAT & QUICK PRESETS (Rule 32) */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Lobby Chat & Quick Messages</span>
          </div>
          <span className="text-xs text-slate-400">Live for everyone in room</span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => sendChat(preset)}
              className="text-xs bg-slate-900/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 px-2.5 py-1 rounded-full transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3 h-36 overflow-y-auto space-y-2 text-xs">
          {chatMessages.length === 0 ? (
            <p className="text-slate-500 text-center italic py-6">
              No chat messages yet. Say hello or click a quick message above!
            </p>
          ) : (
            chatMessages.map((m, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="font-bold text-indigo-400 shrink-0">{m.senderName}:</span>
                <span className="text-slate-200">{m.message}</span>
                <span className="text-[10px] text-slate-500 ml-auto shrink-0">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChat();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type a message..."
            maxLength={80}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
