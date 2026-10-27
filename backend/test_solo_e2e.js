const { io } = require('socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:4000';

async function testSolo() {
  console.log('--- STARTING PLAY WITH COMPUTER (SOLO VS BOTS) TEST ---');

  const client = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => client.on('connect', resolve));
  console.log('✓ Connected to game server');

  let roomCode = null;

  // 1. Create Solo Game
  const startPromise = new Promise((resolve, reject) => {
    client.emit('room:create_solo', {
      nickname: 'Alice',
      playerId: 'p_alice'
    }, (res) => {
      if (!res.success) return reject(new Error(res.error));
      assert.strictEqual(res.room.players.length, 4);
      assert.strictEqual(res.room.players[0].nickname, 'Alice');
      assert.strictEqual(res.room.players[1].isBot, true);
      assert.strictEqual(res.room.players[2].isBot, true);
      assert.strictEqual(res.room.players[3].isBot, true);
      roomCode = res.room.id;
      console.log(`✓ Solo Room created with 3 AI bots (Room: ${roomCode})`);
      resolve(res);
    });
  });

  await startPromise;

  // 2. Listen for match state updates and bot actions
  let currentMatchState = null;

  client.on('match:state_updated', (state) => {
    currentMatchState = state;
  });

  // Wait for bidding to start
  await new Promise((resolve) => {
    const checkBidding = setInterval(() => {
      if (currentMatchState && currentMatchState.phase === 'bidding') {
        clearInterval(checkBidding);
        resolve();
      }
    }, 100);
  });
  console.log('✓ Phase 1 Deal complete: Bidding started');

  // Let bots and Alice bid
  await new Promise((resolve) => {
    const checkPhase = setInterval(() => {
      if (currentMatchState) {
        // If it's Alice's turn to bid, Alice places bid 5 or passes
        if (currentMatchState.phase === 'bidding' && currentMatchState.currentBidderSlot === 1) {
          const bidVal = currentMatchState.currentHighestBid ? 'PASS' : 5;
          client.emit('bid:place', {
            roomCode,
            playerId: 'p_alice',
            bid: bidVal
          });
        }

        // If Alice won contract, Alice selects Trump
        if (currentMatchState.phase === 'trump_selection' && currentMatchState.contract?.contractPlayerSlot === 1) {
          client.emit('trump:select', {
            roomCode,
            playerId: 'p_alice',
            suit: 'HEARTS'
          });
        }

        // Check if advanced to trick_play
        if (currentMatchState.phase === 'trick_play') {
          clearInterval(checkPhase);
          resolve();
        }
      }
    }, 200);
  });
  console.log(`✓ Bidding & Trump Selection complete! Phase advanced to trick_play (Trump: ${currentMatchState.contract?.trickSuit})`);

  // Wait for cards to be played in Trick 1
  await new Promise((resolve) => {
    const trickCheck = setInterval(() => {
      if (currentMatchState && currentMatchState.phase === 'trick_play' && currentMatchState.currentTrick) {
        const turnSlot = currentMatchState.currentTrick.turnSlot;
        // If it's Alice's turn, Alice plays legal card
        if (turnSlot === 1) {
          const hand = currentMatchState.myHand;
          const baseSuit = currentMatchState.currentTrick.baseSuit;
          const trickNum = currentMatchState.currentTrick.trickNumber;

          // Find legal card (no Joker in Trick 1, follow base suit if held)
          let legalCard = null;
          if (!baseSuit) {
            legalCard = hand.find(c => !c.isJoker) || hand[0];
          } else {
            legalCard = hand.find(c => !c.isJoker && c.suit === baseSuit) || hand.find(c => !c.isJoker) || hand[0];
          }

          if (legalCard) {
            client.emit('card:play', {
              roomCode,
              playerId: 'p_alice',
              cardId: legalCard.id
            });
          }
        }

        // Check if at least 1 trick is completed
        if (currentMatchState.completedTricksCount >= 1) {
          clearInterval(trickCheck);
          resolve();
        }
      }
    }, 300);
  });

  console.log(`✓ Trick 1 completed! Tricks won: Team A = ${currentMatchState.tricksWon.teamA}, Team B = ${currentMatchState.tricksWon.teamB}`);

  client.disconnect();
  console.log('--- SOLO VS BOTS E2E TEST COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

testSolo().catch((err) => {
  console.error('SOLO TEST FAILED:', err);
  process.exit(1);
});
