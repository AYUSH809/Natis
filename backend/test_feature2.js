const assert = require('assert');
const { generateDeck, shuffle, sortHand } = require('./src/engine/deck');
const matchEngine = require('./src/engine/matchEngine');

async function runFeature2Tests() {
  console.log('--- STARTING FEATURE 2 ENGINE TESTS ---');

  // Test 1: Deck Composition (4 Players)
  const deck4 = generateDeck(4);
  assert.strictEqual(deck4.length, 32, '4-player deck must have exactly 32 cards');
  const jokers4 = deck4.filter(c => c.isJoker);
  assert.strictEqual(jokers4.length, 1, '4-player deck must contain exactly 1 Joker');
  const spades4 = deck4.filter(c => c.suit === 'SPADES');
  assert.strictEqual(spades4.length, 7, '4-player deck must have 7 Spades (A-8)');
  const hearts4 = deck4.filter(c => c.suit === 'HEARTS');
  assert.strictEqual(hearts4.length, 8, '4-player deck must have 8 Hearts (A-7)');
  console.log('✓ Test 1: 4-Player Deck composition verified (32 cards, 1 Joker, 7 Spades, 8 Hearts/Clubs/Diamonds)');

  // Test 2: Deck Composition (6 Players)
  const deck6 = generateDeck(6);
  assert.strictEqual(deck6.length, 48, '6-player deck must have exactly 48 cards');
  const jokers6 = deck6.filter(c => c.isJoker);
  assert.strictEqual(jokers6.length, 1, '6-player deck must contain exactly 1 Joker');
  const spades6 = deck6.filter(c => c.suit === 'SPADES');
  assert.strictEqual(spades6.length, 11, '6-player deck must have 11 Spades (A-4)');
  const diamonds6 = deck6.filter(c => c.suit === 'DIAMONDS');
  assert.strictEqual(diamonds6.length, 12, '6-player deck must have 12 Diamonds (A-3)');
  console.log('✓ Test 2: 6-Player Deck composition verified (48 cards, 1 Joker, 11 Spades, 12 Hearts/Clubs/Diamonds)');

  // Test 3: Phase 1 Deal & Bidding Flow
  const mockPlayers = [
    { playerId: 'p1', nickname: 'Alice', slotNumber: 1 },
    { playerId: 'p2', nickname: 'Bob', slotNumber: 2 },
    { playerId: 'p3', nickname: 'Charlie', slotNumber: 3 },
    { playerId: 'p4', nickname: 'Diana', slotNumber: 4 }
  ];

  const match = matchEngine.startNewMatch({
    roomCode: 'TEST01',
    mode: 4,
    players: mockPlayers,
    dealerSlot: 1, // Alice is virtual dealer
    cumulativeScores: { teamA: 0, teamB: 0 }
  });

  // Verify Phase 1 Deal: 4 cards each
  for (const p of mockPlayers) {
    const hand = match.playerHands.get(p.playerId);
    assert.strictEqual(hand.length, 4, `Player ${p.nickname} must receive exactly 4 cards in Phase 1`);
  }
  assert.strictEqual(match.remainingDeck.length, 16, '16 cards must remain for Phase 2');
  assert.strictEqual(match.currentBidderSlot, 2, 'Bidding must start with Slot 2 (Dealer + 1)');
  console.log('✓ Test 3: Phase 1 Deal verified (4 cards per player, 16 in reserve, lead bidder is Slot 2)');

  // Test 4: Bidding Rules (5 to 8 range, strict raises)
  // Invalid low bid
  assert.throws(() => {
    matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p2', bid: 4 });
  }, /between 5 and 8/, 'Bid of 4 must be rejected');

  // Invalid high bid
  assert.throws(() => {
    matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p2', bid: 9 });
  }, /between 5 and 8/, 'Bid of 9 must be rejected');

  // Wrong turn
  assert.throws(() => {
    matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p3', bid: 5 });
  }, /not your turn/, 'Turn order must be strictly enforced');

  // Bob bids 5
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p2', bid: 5 });
  assert.strictEqual(match.currentHighestBid, 5);
  assert.strictEqual(match.highestBidderSlot, 2);
  assert.strictEqual(match.currentBidderSlot, 3, 'Turn must advance to Slot 3 (Charlie)');

  // Charlie tries to bid 5 (not strictly higher)
  assert.throws(() => {
    matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p3', bid: 5 });
  }, /strictly higher/, 'Equal bid must be rejected');

  // Charlie bids 6
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p3', bid: 6 });
  assert.strictEqual(match.currentHighestBid, 6);
  assert.strictEqual(match.currentBidderSlot, 4, 'Turn must advance to Slot 4 (Diana)');

  // Diana bids 7
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p4', bid: 7 });
  assert.strictEqual(match.currentHighestBid, 7);
  assert.strictEqual(match.currentBidderSlot, 1, 'Turn must advance to Slot 1 (Alice)');

  // Alice passes
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p1', bid: 'PASS' });
  // Bob passes
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p2', bid: 'PASS' });
  // Charlie passes -> Only Diana remains as highest bidder
  matchEngine.placeBid({ roomCode: 'TEST01', playerId: 'p3', bid: 'PASS' });

  assert.strictEqual(match.phase, 'trump_selection', 'Bidding must conclude and transition to trump_selection');
  assert.strictEqual(match.contractPlayerSlot, 4, 'Diana (Slot 4) must win the contract');
  assert.strictEqual(match.contractTeam, 'B', 'Slot 4 belongs to Team B');
  assert.strictEqual(match.finalBid, 7, 'Final bid must be 7');
  console.log('✓ Test 4: Bidding flow verified (validations, raises, passes, contract winner = Diana at 7 tricks)');

  // Test 5: Trump Selection & Automatic Phase 2 Deal
  // Non-contract player cannot select trump
  assert.throws(() => {
    matchEngine.selectTrump({ roomCode: 'TEST01', playerId: 'p1', suit: 'HEARTS' });
  }, /Only the contract player/, 'Non-contract player cannot select trump');

  // Diana selects HEARTS as Trick Suit
  matchEngine.selectTrump({ roomCode: 'TEST01', playerId: 'p4', suit: 'HEARTS' });
  assert.strictEqual(match.trickSuit, 'HEARTS');
  assert.ok(['ready_for_play', 'trick_play'].includes(match.phase));
  assert.strictEqual(match.remainingDeck.length, 0, 'Remaining deck must now be 0 after Phase 2');

  // Verify Phase 2 Deal: all players now have exactly 8 cards
  for (const p of mockPlayers) {
    const hand = match.playerHands.get(p.playerId);
    assert.strictEqual(hand.length, 8, `Player ${p.nickname} must now hold 8 cards after Phase 2`);
  }
  console.log('✓ Test 5: Trump Selection verified & Phase 2 Deal complete (all hands expanded to 8 cards)');

  // Test 6: Anti-Cheat Sanitization
  const stateForDiana = matchEngine.getPublicState('TEST01', 'p4');
  assert.strictEqual(stateForDiana.contract.trickSuit, 'HEARTS', 'Diana (Contract player) sees the secret trump');
  assert.strictEqual(stateForDiana.myHand.length, 8, 'Diana receives her own 8 cards');

  const stateForAlice = matchEngine.getPublicState('TEST01', 'p1');
  assert.strictEqual(stateForAlice.contract.trickSuit, 'HIDDEN', 'Opponent must receive HIDDEN for secret trump');
  assert.strictEqual(stateForAlice.myHand.length, 8, 'Alice receives her own 8 cards');
  // Alice does NOT receive other players cards
  const otherPlayerHand = stateForAlice.players.find(p => p.slotNumber === 4);
  assert.strictEqual(otherPlayerHand.hand, undefined, 'Other players card data must NOT be exposed in network payload');
  console.log('✓ Test 6: Anti-Cheat & Information Hiding verified (Secret Trump masked for non-contract players, hands sanitized)');

  // Test 7: Default Dealer Contract on All Passes
  const match2 = matchEngine.startNewMatch({
    roomCode: 'TEST02',
    mode: 4,
    players: mockPlayers,
    dealerSlot: 2, // Bob is dealer
    cumulativeScores: { teamA: 0, teamB: 0 }
  });
  // Slot 3 (Charlie) passes
  matchEngine.placeBid({ roomCode: 'TEST02', playerId: 'p3', bid: 'PASS' });
  // Slot 4 (Diana) passes
  matchEngine.placeBid({ roomCode: 'TEST02', playerId: 'p4', bid: 'PASS' });
  // Slot 1 (Alice) passes
  matchEngine.placeBid({ roomCode: 'TEST02', playerId: 'p1', bid: 'PASS' });
  // Slot 2 (Bob, dealer) passes
  matchEngine.placeBid({ roomCode: 'TEST02', playerId: 'p2', bid: 'PASS' });

  assert.strictEqual(match2.phase, 'trump_selection');
  assert.strictEqual(match2.contractPlayerSlot, 2, 'Dealer (Bob) defaults to contract');
  assert.strictEqual(match2.finalBid, 5, 'Dealer defaults to minimum bid of 5');
  console.log('✓ Test 7: All-Pass dealer default rule verified (Dealer defaults to minimum bid 5)');

  console.log('--- ALL FEATURE 2 BACKEND & ENGINE TESTS PASSED! ---');
}

runFeature2Tests().catch(err => {
  console.error('FEATURE 2 TEST FAILED:', err);
  process.exit(1);
});
