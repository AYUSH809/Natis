const { io } = require('socket.io-client');
const assert = require('assert');
const http = require('http');

const SERVER_URL = 'http://localhost:4000';

async function runE2E() {
  console.log('--- STARTING FEATURE 2 E2E MULTI-CLIENT SOCKET TEST ---');

  const createClient = (name) => {
    return new Promise((resolve) => {
      const s = io(SERVER_URL, { transports: ['websocket'] });
      s.on('connect', () => resolve(s));
    });
  };

  const client1 = await createClient('Alice');
  const client2 = await createClient('Bob');
  const client3 = await createClient('Charlie');
  const client4 = await createClient('Diana');

  let roomCode = null;

  // 1. Create Room
  await new Promise((resolve, reject) => {
    client1.emit('room:create', {
      nickname: 'Alice',
      mode: 4,
      playerId: 'p_alice',
      roomName: 'Feature 2 Test Arena'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      roomCode = res.room.id;
      resolve();
    });
  });

  // 2. Join players
  for (const [c, pid, nick] of [
    [client2, 'p_bob', 'Bob'],
    [client3, 'p_charlie', 'Charlie'],
    [client4, 'p_diana', 'Diana']
  ]) {
    await new Promise((resolve, reject) => {
      c.emit('room:join', { roomCode, playerId: pid, nickname: nick }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });
  }

  // 3. Ready up
  for (const [c, pid] of [
    [client2, 'p_bob'],
    [client3, 'p_charlie'],
    [client4, 'p_diana']
  ]) {
    await new Promise((resolve) => {
      c.emit('room:toggle_ready', { roomCode, playerId: pid }, () => resolve());
    });
  }

  // Set up listeners for Phase 1 deal
  const p1Promises = [client1, client2, client3, client4].map((c, idx) => {
    return new Promise((resolve) => {
      c.once('match:state_updated', (state) => {
        assert.strictEqual(state.phase, 'bidding');
        assert.strictEqual(state.myHand.length, 4, `Player ${idx + 1} must receive 4 cards in Phase 1`);
        resolve(state);
      });
    });
  });

  // 4. Start Match
  await new Promise((resolve, reject) => {
    client1.emit('room:start_game', { roomCode, playerId: 'p_alice' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  const phase1States = await Promise.all(p1Promises);
  console.log('✓ Phase 1 Deal: All 4 clients received exactly 4 cards via WebSockets');

  // Lead bidder is Slot 2 (Bob)
  assert.strictEqual(phase1States[0].currentBidderSlot, 2);

  // 5. Bob bids 5
  await new Promise((resolve, reject) => {
    client2.emit('bid:place', { roomCode, playerId: 'p_bob', bid: 5 }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  // 6. Charlie bids 6
  await new Promise((resolve, reject) => {
    client3.emit('bid:place', { roomCode, playerId: 'p_charlie', bid: 6 }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  // 7. Diana bids 7
  await new Promise((resolve, reject) => {
    client4.emit('bid:place', { roomCode, playerId: 'p_diana', bid: 7 }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  // 8. Alice passes
  await new Promise((resolve, reject) => {
    client1.emit('bid:place', { roomCode, playerId: 'p_alice', bid: 'PASS' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  // 9. Bob passes
  await new Promise((resolve, reject) => {
    client2.emit('bid:place', { roomCode, playerId: 'p_bob', bid: 'PASS' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  // Listen for transition to trump_selection on Charlie's pass
  const trumpSelectionPromise = new Promise((resolve) => {
    client4.once('match:state_updated', (state) => {
      if (state.phase === 'trump_selection') {
        assert.strictEqual(state.contract.contractPlayerSlot, 4);
        assert.strictEqual(state.contract.finalBid, 7);
        assert.strictEqual(state.contract.isContractPlayer, true);
        resolve(state);
      }
    });
  });

  // 10. Charlie passes -> Bidding concludes!
  await new Promise((resolve, reject) => {
    client3.emit('bid:place', { roomCode, playerId: 'p_charlie', bid: 'PASS' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  await trumpSelectionPromise;
  console.log('✓ Bidding concluded: Diana (Slot 4) won contract at 7 tricks');

  // Set up listeners for Phase 2 deal (all hands should become 8 cards)
  const p2Promises = [client1, client2, client3, client4].map((c, idx) => {
    return new Promise((resolve) => {
      c.once('match:state_updated', (state) => {
        assert.strictEqual(state.phase, 'ready_for_play');
        assert.strictEqual(state.myHand.length, 8, `Player ${idx + 1} must receive full 8 cards in Phase 2`);
        resolve(state);
      });
    });
  });

  // 11. Diana selects Trump: DIAMONDS
  await new Promise((resolve, reject) => {
    client4.emit('trump:select', { roomCode, playerId: 'p_diana', suit: 'DIAMONDS' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  const phase2States = await Promise.all(p2Promises);
  console.log('✓ Phase 2 Deal: All 4 clients received their full 8-card hands');

  // Diana (contract player) sees DIAMONDS
  assert.strictEqual(phase2States[3].contract.trickSuit, 'DIAMONDS');
  // Alice, Bob, Charlie (non-contract) see HIDDEN
  assert.strictEqual(phase2States[0].contract.trickSuit, 'HIDDEN');
  assert.strictEqual(phase2States[1].contract.trickSuit, 'HIDDEN');
  assert.strictEqual(phase2States[2].contract.trickSuit, 'HIDDEN');
  console.log('✓ Anti-Cheat check: Secret trump is masked as HIDDEN for opponents and visible to Diana');

  // 12. Test End Game CTA
  const endNoticePromise = new Promise((resolve) => {
    client1.once('game:end_requested_notice', (notice) => {
      resolve(notice);
    });
  });

  await new Promise((resolve, reject) => {
    client3.emit('game:request_end', { roomCode, playerId: 'p_charlie' }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      resolve();
    });
  });

  const notice = await endNoticePromise;
  assert.ok(notice.message.includes('final match'));
  console.log('✓ End Game CTA: Session flagged as ending after current match');

  // Cleanup
  client1.disconnect();
  client2.disconnect();
  client3.disconnect();
  client4.disconnect();

  console.log('--- ALL FEATURE 2 E2E TESTS PASSED COMPLETELY! ---');
  process.exit(0);
}

runE2E().catch((err) => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
