const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'natis.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads/writes
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mode INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'lobby',
    owner_id TEXT NOT NULL,
    team_a_score INTEGER NOT NULL DEFAULT 0,
    team_b_score INTEGER NOT NULL DEFAULT 0,
    dealer_slot INTEGER NOT NULL DEFAULT 1,
    match_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS room_players (
    room_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    team TEXT NOT NULL,
    is_ready INTEGER NOT NULL DEFAULT 0,
    is_connected INTEGER NOT NULL DEFAULT 1,
    socket_id TEXT,
    PRIMARY KEY (room_id, player_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    mode INTEGER NOT NULL,
    team_a_score INTEGER NOT NULL,
    team_b_score INTEGER NOT NULL,
    winner_team TEXT NOT NULL,
    bids_summary TEXT,
    match_duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migrations for existing databases
try { db.exec('ALTER TABLE rooms ADD COLUMN team_a_score INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
try { db.exec('ALTER TABLE rooms ADD COLUMN team_b_score INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
try { db.exec('ALTER TABLE rooms ADD COLUMN dealer_slot INTEGER NOT NULL DEFAULT 1'); } catch (_) {}
try { db.exec('ALTER TABLE rooms ADD COLUMN match_count INTEGER NOT NULL DEFAULT 0'); } catch (_) {}

module.exports = db;
