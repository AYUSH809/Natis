const { io } = require('socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:4000';

async function runTest() {
  console.log('--- STARTING FEATURE 1 END-TO-END TEST ---');

  // Helper to create client
  const createClient = (name) => {
    return new Promise((resolve) => {
      const s = io(SERVER_URL, { transports: ['websocket'] });
      s.on('connect', () => {
        resolve(s);
      });
    });
  };

  const client1 = await createClient('Alice');
  const client2 = await createClient('Bob');
  const client3 = await createClient('Charlie');
  const client4 = await createClient('Diana');

  console.log('✓ 4 test clients connected to WebSocket server');

  let roomCode = null;

  // 1. Host creates a 4-player room
  await new Promise((resolve, reject) => {
    client1.emit('room:create', {
      nickname: 'Alice',
      mode: 4,
      playerId: 'p_alice',
      roomName: 'Championship Lobby'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      assert.strictEqual(res.room.mode, 4);
      assert.strictEqual(res.room.ownerId, 'p_alice');
      assert.strictEqual(res.room.players[0].slotNumber, 1);
      assert.strictEqual(res.room.players[0].team, 'A');
      assert.strictEqual(res.room.players[0].isReady, true);
      roomCode = res.room.id;
      console.log(`✓ Room created successfully with Code: ${roomCode}`);
      resolve();
    });
  });

  // 2. Bob joins room
  await new Promise((resolve, reject) => {
    client2.emit('room:join', {
      roomCode,
      nickname: 'Bob',
      playerId: 'p_bob'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      const bob = res.room.players.find(p => p.playerId === 'p_bob');
      assert.strictEqual(bob.slotNumber, 2);
      assert.strictEqual(bob.team, 'B'); // Even slot = Team B
      console.log('✓ Bob joined into Slot 2 (Team B)');
      resolve();
    });
  });

  // 3. Charlie joins room
  await new Promise((resolve, reject) => {
    client3.emit('room:join', {
      roomCode,
      nickname: 'Charlie',
      playerId: 'p_charlie'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      const charlie = res.room.players.find(p => p.playerId === 'p_charlie');
      assert.strictEqual(charlie.slotNumber, 3);
      assert.strictEqual(charlie.team, 'A'); // Odd slot = Team A
      console.log('✓ Charlie joined into Slot 3 (Team A)');
      resolve();
    });
  });

  // 4. Diana joins room
  await new Promise((resolve, reject) => {
    client4.emit('room:join', {
      roomCode,
      nickname: 'Diana',
      playerId: 'p_diana'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      const diana = res.room.players.find(p => p.playerId === 'p_diana');
      assert.strictEqual(diana.slotNumber, 4);
      assert.strictEqual(diana.team, 'B'); // Even slot = Team B
      console.log('✓ Diana joined into Slot 4 (Team B) - Room is now FULL (4/4)');
      resolve();
    });
  });

  // 5. Test slot conflict (Charlie tries to switch to occupied Slot 2)
  await new Promise((resolve) => {
    client3.emit('room:select_slot', {
      roomCode,
      playerId: 'p_charlie',
      targetSlot: 2
    }, (res) => {
      assert.strictEqual(res.success, false);
      assert.ok(res.error.includes('already occupied'));
      console.log('✓ Slot collision check passed (Charlie cannot steal Bob\'s slot)');
      resolve();
    });
  });

  // 6. Test premature start (players not ready yet)
  await new Promise((resolve) => {
    client1.emit('room:start_game', {
      roomCode,
      playerId: 'p_alice'
    }, (res) => {
      assert.strictEqual(res.success, false);
      assert.ok(res.error.includes('Waiting for players to get ready'));
      console.log('✓ Start game validation passed (Prevented premature start before ready)');
      resolve();
    });
  });

  // 7. Players ready up
  for (const [client, pid, name] of [[client2, 'p_bob', 'Bob'], [client3, 'p_charlie', 'Charlie'], [client4, 'p_diana', 'Diana']]) {
    await new Promise((resolve, reject) => {
      client.emit('room:toggle_ready', {
        roomCode,
        playerId: pid
      }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        const p = res.room.players.find(x => x.playerId === pid);
        assert.strictEqual(p.isReady, true);
        console.log(`✓ ${name} marked as Ready`);
        resolve();
      });
    });
  }

  // 8. Start Game as Host
  await new Promise((resolve, reject) => {
    client1.emit('room:start_game', {
      roomCode,
      playerId: 'p_alice'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      assert.strictEqual(res.success, true);
      console.log('✓ Host started the game successfully!');
      resolve();
    });
  });

  // 9. Verify Database Persistence
  const db = require('./src/db/database');
  const dbRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomCode);
  const dbPlayers = db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(roomCode);
  assert.ok(dbRoom, 'Room must exist in SQLite DB');
  assert.strictEqual(dbPlayers.length, 4, 'All 4 players must be stored in SQLite DB');
  console.log(`✓ SQLite verified: Room ${dbRoom.id} and ${dbPlayers.length} players persisted.`);

  // Cleanup
  client1.disconnect();
  client2.disconnect();
  client3.disconnect();
  client4.disconnect();

  console.log('--- FEATURE 1 TESTS PASSED COMPLETELY! ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
