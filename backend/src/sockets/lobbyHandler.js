const roomManager = require('../models/roomManager');
const matchEngine = require('../engine/matchEngine');
const db = require('../db/database');

function registerLobbyHandlers(io, socket) {
  // CREATE ROOM
  socket.on('room:create', ({ nickname, mode, playerId, roomName }, callback) => {
    try {
      if (!nickname || !nickname.trim()) {
        return callback && callback({ success: false, error: 'Nickname is required' });
      }
      if (!playerId) {
        return callback && callback({ success: false, error: 'Player ID is required' });
      }

      const room = roomManager.createRoom({
        nickname,
        mode: Number(mode) || 4,
        playerId,
        socketId: socket.id,
        roomName
      });

      socket.join(room.id);
      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // JOIN ROOM
  socket.on('room:join', ({ roomCode, nickname, playerId }, callback) => {
    try {
      if (!roomCode) {
        return callback && callback({ success: false, error: 'Room code is required' });
      }
      if (!nickname || !nickname.trim()) {
        return callback && callback({ success: false, error: 'Nickname is required' });
      }
      if (!playerId) {
        return callback && callback({ success: false, error: 'Player ID is required' });
      }

      const room = roomManager.joinRoom({
        roomCode,
        nickname,
        playerId,
        socketId: socket.id
      });

      socket.join(room.id);
      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // SELECT / CHANGE SLOT
  socket.on('room:select_slot', ({ roomCode, playerId, targetSlot }, callback) => {
    try {
      const room = roomManager.selectSlot({
        roomCode,
        playerId,
        targetSlot: Number(targetSlot)
      });
      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // TOGGLE READY STATUS
  socket.on('room:toggle_ready', ({ roomCode, playerId }, callback) => {
    try {
      const room = roomManager.toggleReady({ roomCode, playerId });
      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // CHANGE ROOM MODE (4 or 6)
  socket.on('room:change_mode', ({ roomCode, playerId, newMode }, callback) => {
    try {
      const room = roomManager.changeMode({
        roomCode,
        playerId,
        newMode: Number(newMode)
      });
      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // KICK PLAYER (Owner only)
  socket.on('room:kick', ({ roomCode, ownerPlayerId, targetPlayerId }, callback) => {
    try {
      const { room, kickedPlayer } = roomManager.kickPlayer({
        roomCode,
        ownerPlayerId,
        targetPlayerId
      });

      if (kickedPlayer && kickedPlayer.socketId) {
        const targetSocket = io.sockets.sockets.get(kickedPlayer.socketId);
        if (targetSocket) {
          targetSocket.leave(room.id);
          targetSocket.emit('room:kicked', { message: 'You have been removed from the room by the host.' });
        }
      }

      if (callback) callback({ success: true, room });
      io.to(room.id).emit('room:updated', room);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // LEAVE ROOM
  socket.on('room:leave', ({ playerId }, callback) => {
    try {
      const result = roomManager.leaveRoom({ playerId, socketId: socket.id });
      if (result) {
        socket.leave(result.roomCode);
        if (result.room) {
          io.to(result.room.id).emit('room:updated', result.room);
        }
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // START GAME (Owner only)
  socket.on('room:start_game', ({ roomCode, playerId }, callback) => {
    try {
      roomManager.canStartGame(roomCode, playerId);
      const room = roomManager.getRoom(roomCode);
      room.status = 'playing';

      const dbRoom = db.prepare('SELECT team_a_score, team_b_score, dealer_slot FROM rooms WHERE id = ?').get(room.id);
      const cumulativeScores = {
        teamA: dbRoom ? dbRoom.team_a_score : 0,
        teamB: dbRoom ? dbRoom.team_b_score : 0
      };
      const dealerSlot = dbRoom ? dbRoom.dealer_slot : 1;

      // Initialize match with Two-Phase Deal & Bidding
      matchEngine.startNewMatch({
        roomCode: room.id,
        mode: room.mode,
        players: room.players,
        dealerSlot,
        cumulativeScores,
        endGameRequested: false
      });

      db.prepare("UPDATE rooms SET status = 'playing' WHERE id = ?").run(room.id);

      if (callback) callback({ success: true, message: 'Game starting...' });
      io.to(room.id).emit('game:started', { roomCode: room.id, room });
      io.to(room.id).emit('room:updated', room);

      // Broadcast sanitized Phase 1 cards & bidding state to each player
      const { broadcastMatchState } = require('./gameHandler');
      broadcastMatchState(io, room.id);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // QUICK CHAT / EMOJI (Rule 32)
  socket.on('room:chat_message', ({ roomCode, senderName, message, type = 'text' }) => {
    if (!roomCode || !message) return;
    io.to(roomCode.toUpperCase()).emit('room:chat_received', {
      senderName,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  });

  // DISCONNECT HANDLER
  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.id);
    if (result && result.room) {
      io.to(result.room.id).emit('room:updated', result.room);
      io.to(result.room.id).emit('player:connection_changed', {
        playerId: result.player.playerId,
        nickname: result.player.nickname,
        isConnected: false
      });
    }
  });
}

module.exports = registerLobbyHandlers;
