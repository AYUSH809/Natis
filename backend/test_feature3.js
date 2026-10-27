const assert = require('assert');
const matchEngine = require('./src/engine/matchEngine');
const botEngine = require('./src/engine/botEngine');

async function runFeature3Tests() {
  console.log('--- STARTING FEATURE 3 TRICK ENGINE & BOT TESTS ---');

  const mockPlayers = [
    { playerId: 'p1', nickname: 'Alice', slotNumber: 1, isBot: false },
    { playerId: 'p2', nickname: 'Bob', slotNumber: 2, isBot: false },
    { playerId: 'p3', nickname: 'Charlie', slotNumber: 3, isBot: false },
    { playerId: 'p4', nickname: 'Diana', slotNumber: 4, isBot: false }
  ];

  // 1. Setup Match & Advance to Trick Play
  const match = matchEngine.startNewMatch({
    roomCode: 'FEAT3_TEST',
    mode: 4,
    players: mockPlayers,
    dealerSlot: 1,
    cumulativeScores: { teamA: 0, teamB: 0 }
  });

  // Bob bids 5, others pass
  matchEngine.placeBid({ roomCode: 'FEAT3_TEST', playerId: 'p2', bid: 5 });
  matchEngine.placeBid({ roomCode: 'FEAT3_TEST', playerId: 'p3', bid: 'PASS' });
  matchEngine.placeBid({ roomCode: 'FEAT3_TEST', playerId: 'p4', bid: 'PASS' });
  matchEngine.placeBid({ roomCode: 'FEAT3_TEST', playerId: 'p1', bid: 'PASS' });

  // Bob selects HEARTS as Trump
  matchEngine.selectTrump({ roomCode: 'FEAT3_TEST', playerId: 'p2', suit: 'HEARTS' });
  assert.strictEqual(match.phase, 'trick_play');
  assert.strictEqual(match.currentTrick.trickNumber, 1);
  assert.strictEqual(match.currentTrick.turnSlot, 2, 'Lead player of Trick 1 is (Dealer + 1) = Slot 2');
  console.log('✓ Advanced to Trick Play Phase (Trick 1 ready)');

  // 2. Test Rule 5: Joker cannot be played in Trick 1
  const bobHand = match.playerHands.get('p2');
  // Inject a Joker into Bob's hand for testing
  const jokerCard = { id: 'JOKER', suit: 'JOKER', rank: 99, label: 'JK', isJoker: true };
  bobHand.push(jokerCard);

  assert.throws(() => {
    matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p2', cardId: 'JOKER' });
  }, /Joker cannot be played in Round 1/, 'Playing Joker in Trick 1 must be rejected');
  console.log('✓ Rule 5 Verified: Joker forbidden in Trick 1');

  // Remove test joker from Bob
  bobHand.splice(bobHand.findIndex(c => c.id === 'JOKER'), 1);

  // 3. Test Base Suit Establishment & Following
  // Bob plays a Clubs card
  const clubCard = bobHand.find(c => c.suit === 'CLUBS') || bobHand[0];
  matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p2', cardId: clubCard.id });
  assert.strictEqual(match.currentTrick.baseSuit, clubCard.suit);
  assert.strictEqual(match.currentTrick.turnSlot, 3, 'Turn advanced to Slot 3 (Charlie)');

  // Charlie tries to play a non-base card when holding base suit
  const charlieHand = match.playerHands.get('p3');
  const charlieHasBase = charlieHand.some(c => c.suit === match.currentTrick.baseSuit && !c.isJoker);
  const nonBaseCard = charlieHand.find(c => c.suit !== match.currentTrick.baseSuit && !c.isJoker);

  if (charlieHasBase && nonBaseCard) {
    assert.throws(() => {
      matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p3', cardId: nonBaseCard.id });
    }, /must follow the Base Suit/, 'Must follow base suit if held');
    console.log('✓ Rule 13 Verified: Suit-following strictly enforced');
  }

  // 4. Test Reveal Trump Validation (Cannot reveal if holding Base Suit)
  if (charlieHasBase) {
    assert.throws(() => {
      matchEngine.revealTrump({ roomCode: 'FEAT3_TEST', playerId: 'p3' });
    }, /cannot reveal Trump while holding cards of the Base Suit/, 'Reveal forbidden while holding base suit');
    console.log('✓ Rule 2 Verified: Reveal prohibited if holding Base Suit');
  }

  // 5. Play remaining cards of Trick 1 legally
  const charliePlayCard = charlieHand.find(c => c.suit === match.currentTrick.baseSuit && !c.isJoker) || charlieHand[0];
  matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p3', cardId: charliePlayCard.id });

  const dianaHand = match.playerHands.get('p4');
  const dianaPlayCard = dianaHand.find(c => c.suit === match.currentTrick.baseSuit && !c.isJoker) || dianaHand[0];
  matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p4', cardId: dianaPlayCard.id });

  const aliceHand = match.playerHands.get('p1');
  const alicePlayCard = aliceHand.find(c => c.suit === match.currentTrick.baseSuit && !c.isJoker) || aliceHand[0];
  matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: 'p1', cardId: alicePlayCard.id });

  assert.strictEqual(match.currentTrick.isResolving, true, 'Trick must be marked as resolving for animation');
  assert.ok(match.currentTrick.winner, 'Winner must be evaluated for animation');
  matchEngine.finalizeCompletedTrick(match);

  assert.strictEqual(match.completedTricks.length, 1, 'Trick 1 must be completed and stored');
  assert.strictEqual(match.currentTrick.trickNumber, 2, 'Trick 2 must be initialized');
  console.log('✓ Trick 1 completed successfully and winner collected trick');

  // 6. Test Rule 5: In Trick 2, Joker CANNOT open/lead
  const trick2LeaderSlot = match.currentTrick.leaderSlot;
  const leaderPlayer = mockPlayers.find(p => p.slotNumber === trick2LeaderSlot);
  const leaderHand = match.playerHands.get(leaderPlayer.playerId);
  leaderHand.push(jokerCard);

  assert.throws(() => {
    matchEngine.playCard({ roomCode: 'FEAT3_TEST', playerId: leaderPlayer.playerId, cardId: 'JOKER' });
  }, /cannot be played as the opening card of a round to establish Base Suit/, 'Joker cannot lead in Tricks 2-7');
  console.log('✓ Rule 5 Verified: Joker cannot open in Tricks 2-7');
  leaderHand.splice(leaderHand.findIndex(c => c.id === 'JOKER'), 1);

  // 7. Test Bot Engine Decisions
  const sampleHand = [
    { id: '1', suit: 'HEARTS', rank: 14, isJoker: false },
    { id: '2', suit: 'HEARTS', rank: 13, isJoker: false },
    { id: '3', suit: 'HEARTS', rank: 11, isJoker: false },
    { id: '4', suit: 'CLUBS', rank: 8, isJoker: false }
  ];
  const botBid = botEngine.decideBid(sampleHand, null);
  assert.strictEqual(botBid, 5, 'Bot should bid 5 on strong Ace-King hand');

  const trumpChoice = botEngine.decideTrumpSuit(sampleHand);
  assert.strictEqual(trumpChoice, 'HEARTS', 'Bot should pick HEARTS with 3 Hearts');
  console.log('✓ Bot Engine: Bidding and Trump selection heuristics verified');

  console.log('--- ALL FEATURE 3 TESTS PASSED! ---');
}

runFeature3Tests().catch(err => {
  console.error('FEATURE 3 TEST FAILED:', err);
  process.exit(1);
});
