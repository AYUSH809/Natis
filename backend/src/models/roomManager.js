const db = require('../db/database');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> room object
    this.playerToRoom = new Map(); // socketId or playerId -> roomCode
    this.loadActiveRoomsFromDb();
  }

  loadActiveRoomsFromDb() {
    try {
      const activeRooms = db.prepare("SELECT * FROM rooms WHERE status = 'lobby'").all();
      for (const r of activeRooms) {
        const players = db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(r.id);
        this.rooms.set(r.id, {
          id: r.id,
          name: r.name,
          mode: r.mode,
          status: r.status,
          ownerId: r.owner_id,
          players: players.map(p => ({
            playerId: p.player_id,
            nickname: p.nickname,
            slotNumber: p.slot_number,
            team: p.team,
            isReady: Boolean(p.is_ready),
            isConnected: false, // will connect via socket
            socketId: null
          }))
        });
      }
    } catch (err) {
      console.error('Error loading rooms from DB:', err.message);
    }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  getTeamForSlot(slotNumber) {
    // Slot 1, 3, 5 -> Team A; Slot 2, 4, 6 -> Team B
    return slotNumber % 2 === 1 ? 'A' : 'B';
  }

  createRoom({ nickname, mode = 4, playerId, socketId, roomName }) {
    const roomCode = this.generateRoomCode();
    const normalizedMode = mode === 6 ? 6 : 4;
    const name = roomName && roomName.trim() ? roomName.trim() : `Room ${roomCode}`;

    const hostPlayer = {
      playerId,
      nickname: nickname.trim(),
      slotNumber: 1,
      team: this.getTeamForSlot(1),
      isReady: true, // host is ready by default
      isConnected: true,
      socketId
    };

    const room = {
      id: roomCode,
      name,
      mode: normalizedMode,
      status: 'lobby',
      ownerId: playerId,
      players: [hostPlayer]
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(socketId, roomCode);
    this.playerToRoom.set(playerId, roomCode);

    // Persist to DB
    try {
      db.prepare(`
        INSERT INTO rooms (id, name, mode, status, owner_id)
        VALUES (?, ?, ?, 'lobby', ?)
      `).run(roomCode, name, normalizedMode, playerId);

      db.prepare(`
        INSERT INTO room_players (room_id, player_id, nickname, slot_number, team, is_ready, is_connected, socket_id)
        VALUES (?, ?, ?, 1, 'A', 1, 1, ?)
      `).run(roomCode, playerId, hostPlayer.nickname, socketId);
    } catch (err) {
      console.error('DB Insert Room Error:', err.message);
    }

    return room;
  }

  createSoloWithBots({ nickname, playerId, socketId }) {
    const roomCode = this.generateRoomCode();
    const humanPlayer = {
      playerId,
      nickname: nickname.trim(),
      slotNumber: 1,
      team: 'A',
      isReady: true,
      isConnected: true,
      isBot: false,
      socketId
    };

    const bot1 = {
      playerId: `bot_${roomCode}_2`,
      nickname: 'Bot Beta',
      slotNumber: 2,
      team: 'B',
      isReady: true,
      isConnected: true,
      isBot: true,
      socketId: null
    };

    const bot2 = {
      playerId: `bot_${roomCode}_3`,
      nickname: 'Bot Alpha (Partner)',
      slotNumber: 3,
      team: 'A',
      isReady: true,
      isConnected: true,
      isBot: true,
      socketId: null
    };

    const bot3 = {
      playerId: `bot_${roomCode}_4`,
      nickname: 'Bot Gamma',
      slotNumber: 4,
      team: 'B',
      isReady: true,
      isConnected: true,
      isBot: true,
      socketId: null
    };

    const room = {
      id: roomCode,
      name: 'Solo vs Computer',
      mode: 4,
      status: 'lobby',
      ownerId: playerId,
      isSolo: true,
      players: [humanPlayer, bot1, bot2, bot3]
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(socketId, roomCode);
    this.playerToRoom.set(playerId, roomCode);

    try {
      db.prepare(`
        INSERT INTO rooms (id, name, mode, status, owner_id)
        VALUES (?, ?, 4, 'lobby', ?)
      `).run(roomCode, room.name, playerId);

      const insertPlayer = db.prepare(`
        INSERT INTO room_players (room_id, player_id, nickname, slot_number, team, is_ready, is_connected, socket_id)
        VALUES (?, ?, ?, ?, ?, 1, 1, ?)
      `);

      insertPlayer.run(roomCode, playerId, humanPlayer.nickname, 1, 'A', socketId);
      insertPlayer.run(roomCode, bot1.playerId, bot1.nickname, 2, 'B', null);
      insertPlayer.run(roomCode, bot2.playerId, bot2.nickname, 3, 'A', null);
      insertPlayer.run(roomCode, bot3.playerId, bot3.nickname, 4, 'B', null);
    } catch (err) {
      console.error('DB Insert Solo Room Error:', err.message);
    }

    return room;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  joinRoom({ roomCode, nickname, playerId, socketId }) {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      throw new Error('Room not found. Please check the code.');
    }

    if (room.status !== 'lobby') {
      throw new Error('Game has already started in this room.');
    }

    // Check if player is already in this room (e.g. reconnect or tab refresh)
    const existingIndex = room.players.findIndex(p => p.playerId === playerId);
    if (existingIndex !== -1) {
      const existing = room.players[existingIndex];
      existing.socketId = socketId;
      existing.isConnected = true;
      existing.nickname = nickname ? nickname.trim() : existing.nickname;
      this.playerToRoom.set(socketId, code);
      this.playerToRoom.set(playerId, code);

      try {
        db.prepare(`
          UPDATE room_players
          SET is_connected = 1, socket_id = ?, nickname = ?
          WHERE room_id = ? AND player_id = ?
        `).run(socketId, existing.nickname, code, playerId);
      } catch (err) {
        console.error('DB update reconnect error:', err.message);
      }
      return room;
    }

    // Check capacity
    if (room.players.length >= room.mode) {
      throw new Error(`Room is full (${room.mode}/${room.mode} players).`);
    }

    // Find first available slot
    const occupiedSlots = new Set(room.players.map(p => p.slotNumber));
    let assignedSlot = 1;
    for (let s = 1; s <= room.mode; s++) {
      if (!occupiedSlots.has(s)) {
        assignedSlot = s;
        break;
      }
    }

    const newPlayer = {
      playerId,
      nickname: nickname.trim(),
      slotNumber: assignedSlot,
      team: this.getTeamForSlot(assignedSlot),
      isReady: false,
      isConnected: true,
      socketId
    };

    room.players.push(newPlayer);
    this.playerToRoom.set(socketId, code);
    this.playerToRoom.set(playerId, code);

    try {
      db.prepare(`
        INSERT INTO room_players (room_id, player_id, nickname, slot_number, team, is_ready, is_connected, socket_id)
        VALUES (?, ?, ?, ?, ?, 0, 1, ?)
      `).run(code, playerId, newPlayer.nickname, assignedSlot, newPlayer.team, socketId);
    } catch (err) {
      console.error('DB insert player error:', err.message);
    }

    return room;
  }

  selectSlot({ roomCode, playerId, targetSlot }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'lobby') throw new Error('Cannot change slots after match start');
    if (targetSlot < 1 || targetSlot > room.mode) throw new Error(`Invalid slot (1-${room.mode})`);

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not in this room');

    if (player.slotNumber === targetSlot) return room;

    const occupant = room.players.find(p => p.slotNumber === targetSlot);
    if (occupant) {
      throw new Error(`Slot ${targetSlot} is already occupied by ${occupant.nickname}`);
    }

    player.slotNumber = targetSlot;
    player.team = this.getTeamForSlot(targetSlot);

    try {
      db.prepare(`
        UPDATE room_players
        SET slot_number = ?, team = ?
        WHERE room_id = ? AND player_id = ?
      `).run(targetSlot, player.team, room.id, playerId);
    } catch (err) {
      console.error('DB update slot error:', err.message);
    }

    return room;
  }

  toggleReady({ roomCode, playerId }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not in room');

    player.isReady = !player.isReady;

    try {
      db.prepare(`
        UPDATE room_players
        SET is_ready = ?
        WHERE room_id = ? AND player_id = ?
      `).run(player.isReady ? 1 : 0, room.id, playerId);
    } catch (err) {
      console.error('DB update ready error:', err.message);
    }

    return room;
  }

  changeMode({ roomCode, playerId, newMode }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.ownerId !== playerId) throw new Error('Only the room owner can change mode');
    if (newMode !== 4 && newMode !== 6) throw new Error('Mode must be 4 or 6 players');
    if (room.mode === newMode) return room;

    if (newMode === 4 && room.players.some(p => p.slotNumber > 4)) {
      throw new Error('Cannot reduce to 4 players while slots 5 or 6 are occupied. Please reassign or kick players first.');
    }

    room.mode = newMode;

    try {
      db.prepare(`
        UPDATE rooms
        SET mode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newMode, room.id);
    } catch (err) {
      console.error('DB update mode error:', err.message);
    }

    return room;
  }

  kickPlayer({ roomCode, ownerPlayerId, targetPlayerId }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.ownerId !== ownerPlayerId) throw new Error('Only the room owner can kick players');
    if (ownerPlayerId === targetPlayerId) throw new Error('Room owner cannot kick themselves');

    const targetIdx = room.players.findIndex(p => p.playerId === targetPlayerId);
    if (targetIdx === -1) throw new Error('Target player not found in room');

    const [kicked] = room.players.splice(targetIdx, 1);
    if (kicked.socketId) {
      this.playerToRoom.delete(kicked.socketId);
    }
    this.playerToRoom.delete(targetPlayerId);

    try {
      db.prepare('DELETE FROM room_players WHERE room_id = ? AND player_id = ?').run(room.id, targetPlayerId);
    } catch (err) {
      console.error('DB delete player error:', err.message);
    }

    return { room, kickedPlayer: kicked };
  }

  leaveRoom({ playerId, socketId }) {
    const roomCode = this.playerToRoom.get(socketId) || this.playerToRoom.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const playerIdx = room.players.findIndex(p => p.playerId === playerId || p.socketId === socketId);
    if (playerIdx === -1) return null;

    const [leavingPlayer] = room.players.splice(playerIdx, 1);
    this.playerToRoom.delete(socketId);
    this.playerToRoom.delete(playerId);

    try {
      db.prepare('DELETE FROM room_players WHERE room_id = ? AND player_id = ?').run(room.id, leavingPlayer.playerId);
    } catch (err) {
      console.error('DB remove player on leave error:', err.message);
    }

    // If room is empty, remove room
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      try {
        db.prepare('DELETE FROM rooms WHERE id = ?').run(roomCode);
      } catch (err) {
        console.error('DB delete empty room error:', err.message);
      }
      return { room: null, leavingPlayer, roomCode };
    }

    // If owner left, transfer ownership to the next player
    if (room.ownerId === leavingPlayer.playerId && room.players.length > 0) {
      room.ownerId = room.players[0].playerId;
      room.players[0].isReady = true;
      try {
        db.prepare('UPDATE rooms SET owner_id = ? WHERE id = ?').run(room.ownerId, roomCode);
        db.prepare('UPDATE room_players SET is_ready = 1 WHERE room_id = ? AND player_id = ?').run(roomCode, room.ownerId);
      } catch (err) {
        console.error('DB transfer owner error:', err.message);
      }
    }

    return { room, leavingPlayer, roomCode };
  }

  handleDisconnect(socketId) {
    const roomCode = this.playerToRoom.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.isConnected = false;
      player.socketId = null;

      try {
        db.prepare(`
          UPDATE room_players
          SET is_connected = 0, socket_id = NULL
          WHERE room_id = ? AND player_id = ?
        `).run(roomCode, player.playerId);
      } catch (err) {
        console.error('DB disconnect update error:', err.message);
      }
    }

    this.playerToRoom.delete(socketId);
    return { room, player };
  }

  canStartGame(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.ownerId !== playerId) throw new Error('Only the room owner can start the match');
    if (room.players.length !== room.mode) {
      throw new Error(`Need exactly ${room.mode} players to start (currently ${room.players.length}/${room.mode})`);
    }

    // Verify all slots from 1 to mode are occupied
    const slots = new Set(room.players.map(p => p.slotNumber));
    for (let s = 1; s <= room.mode; s++) {
      if (!slots.has(s)) {
        throw new Error(`Slot ${s} is empty`);
      }
    }

    const unreadyPlayers = room.players.filter(p => !p.isReady);
    if (unreadyPlayers.length > 0) {
      const names = unreadyPlayers.map(p => p.nickname).join(', ');
      throw new Error(`Waiting for players to get ready: ${names}`);
    }

    return true;
  }
}

module.exports = new RoomManager();
