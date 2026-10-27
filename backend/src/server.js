const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');
const roomManager = require('./models/roomManager');
const registerLobbyHandlers = require('./sockets/lobbyHandler');
const { registerGameHandlers } = require('./sockets/gameHandler');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'NATIS',
    version: '1.0',
    activeRooms: roomManager.rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    name: room.name,
    mode: room.mode,
    status: room.status,
    playerCount: room.players.length,
    isFull: room.players.length >= room.mode
  });
});

// Rule 30: Match History (Last 10 completed matches)
app.get('/api/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM match_history
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerLobbyHandlers(io, socket);
  registerGameHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`NATIS Game Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
