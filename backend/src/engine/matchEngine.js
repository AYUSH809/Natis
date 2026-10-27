const { generateDeck, shuffle, sortHand, SUITS } = require('./deck');
const botEngine = require('./botEngine');
const db = require('../db/database');

class MatchEngine {
  constructor() {
    this.matches = new Map(); // roomCode -> MatchState
  }

  getMatch(roomCode) {
    if (!roomCode) return null;
    return this.matches.get(roomCode.toUpperCase()) || null;
  }

  startNewMatch({ roomCode, mode = 4, players, dealerSlot = 1, cumulativeScores, endGameRequested = false }) {
    const code = roomCode.toUpperCase();
    const sortedPlayers = [...players].sort((a, b) => a.slotNumber - b.slotNumber);

    // Generate & shuffle deck
    const fullDeck = shuffle(generateDeck(mode));

    // Two-Phase Deal:
    // Phase 1 Deal: 4 cards to each player
    const playerHands = new Map();
    const initialDealtCards = new Map(); // To audit match dissolution rule
    let cardIdx = 0;

    for (const p of sortedPlayers) {
      const phase1Cards = fullDeck.slice(cardIdx, cardIdx + 4);
      playerHands.set(p.playerId, sortHand(phase1Cards));
      initialDealtCards.set(p.playerId, [...phase1Cards]);
      cardIdx += 4;
    }

    const remainingDeck = fullDeck.slice(cardIdx);

    // Bidding starts at (dealerSlot % mode) + 1
    const firstBidderSlot = (dealerSlot % mode) + 1;

    const matchState = {
      matchId: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomCode: code,
      mode,
      players: sortedPlayers,
      dealerSlot,
      phase: 'bidding', // 'bidding' | 'trump_selection' | 'trick_play' | 'match_ended' | 'match_dissolved' | 'game_over'
      remainingDeck,
      playerHands,
      initialDealtCards,
      // Bidding State
      currentBidderSlot: firstBidderSlot,
      currentHighestBid: null,
      highestBidderSlot: null,
      passedSlots: new Set(),
      bidHistory: [],
      // Contract State
      contractPlayerSlot: null,
      contractPlayerId: null,
      contractTeam: null,
      finalBid: null,
      trickSuit: null,
      isTrumpRevealed: false,
      trumpRevealerSlot: null,
      boundToTrumpSuitForPlayerId: null,
      // Trick-taking State (Feature 3)
      currentTrick: {
        trickNumber: 1,
        leaderSlot: firstBidderSlot,
        turnSlot: firstBidderSlot,
        baseSuit: null,
        cardsPlayed: [],
        revealedInThisTrick: false
      },
      tricksWon: { teamA: 0, teamB: 0 },
      completedTricks: [],
      // Session cumulative scores
      teamScores: cumulativeScores || { teamA: 0, teamB: 0 },
      endGameRequested: Boolean(endGameRequested),
      createdAt: new Date().toISOString()
    };

    this.matches.set(code, matchState);
    return matchState;
  }

  placeBid({ roomCode, playerId, bid }) {
    const match = this.getMatch(roomCode);
    if (!match) throw new Error('Active match not found');
    if (match.phase !== 'bidding') throw new Error('Not currently in the bidding phase');

    const player = match.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not in this match');

    if (player.slotNumber !== match.currentBidderSlot) {
      throw new Error(`It is not your turn to bid (Waiting on Slot ${match.currentBidderSlot})`);
    }

    const isPass = bid === 'PASS' || bid === null || bid === undefined;

    if (isPass) {
      match.passedSlots.add(player.slotNumber);
      match.bidHistory.push({
        slotNumber: player.slotNumber,
        nickname: player.nickname,
        action: 'PASS',
        highestBidAtTime: match.currentHighestBid
      });

      const activeSlotsCount = match.mode - match.passedSlots.size;

      // Case 1: If someone placed a bid and everyone else passed
      if (match.currentHighestBid !== null && activeSlotsCount <= 1) {
        return this.finalizeBidding(match, match.highestBidderSlot, match.currentHighestBid);
      }

      // Case 2: If EVERYONE passed with no bids placed -> Dealer defaults to 5
      if (match.passedSlots.size === match.mode && match.currentHighestBid === null) {
        return this.finalizeBidding(match, match.dealerSlot, 5, true);
      }
    } else {
      const numBid = Number(bid);
      if (isNaN(numBid) || numBid < 5 || numBid > 8) {
        throw new Error('Bid must be between 5 and 8');
      }

      if (match.currentHighestBid !== null && numBid <= match.currentHighestBid) {
        throw new Error(`Bid must be strictly higher than current highest bid (${match.currentHighestBid})`);
      }

      match.currentHighestBid = numBid;
      match.highestBidderSlot = player.slotNumber;
      match.bidHistory.push({
        slotNumber: player.slotNumber,
        nickname: player.nickname,
        action: 'BID',
        bid: numBid
      });

      if (numBid === 8 && match.passedSlots.size === match.mode - 1) {
        return this.finalizeBidding(match, match.highestBidderSlot, 8);
      }
    }

    // Advance to next eligible clockwise bidder
    let nextSlot = (match.currentBidderSlot % match.mode) + 1;
    let attempts = 0;
    while (match.passedSlots.has(nextSlot) && attempts < match.mode) {
      nextSlot = (nextSlot % match.mode) + 1;
      attempts++;
    }

    if (match.currentHighestBid !== null && (match.mode - match.passedSlots.size <= 1)) {
      return this.finalizeBidding(match, match.highestBidderSlot, match.currentHighestBid);
    }

    match.currentBidderSlot = nextSlot;
    return match;
  }

  finalizeBidding(match, winnerSlot, finalBid, defaulted = false) {
    const winner = match.players.find(p => p.slotNumber === winnerSlot);
    match.contractPlayerSlot = winnerSlot;
    match.contractPlayerId = winner.playerId;
    match.contractTeam = winnerSlot % 2 === 1 ? 'A' : 'B';
    match.finalBid = finalBid;
    match.phase = 'trump_selection';
    match.biddingCompleted = true;
    match.defaultedByDealer = defaulted;

    return match;
  }

  selectTrump({ roomCode, playerId, suit }) {
    const match = this.getMatch(roomCode);
    if (!match) throw new Error('Active match not found');
    if (match.phase !== 'trump_selection') throw new Error('Not in trump selection phase');

    if (playerId !== match.contractPlayerId) {
      throw new Error('Only the contract player can select the Trick Suit');
    }

    const validSuits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES', 'JOKER'];
    const normalizedSuit = String(suit).toUpperCase();
    if (!validSuits.includes(normalizedSuit)) {
      throw new Error(`Invalid Trick Suit. Choose one of: ${validSuits.join(', ')}`);
    }

    match.trickSuit = normalizedSuit;

    // Phase 2 Deal: remaining 4 cards to each player (total 8 cards each)
    let cardIdx = 0;
    for (const p of match.players) {
      const phase2Cards = match.remainingDeck.slice(cardIdx, cardIdx + 4);
      const existingHand = match.playerHands.get(p.playerId) || [];
      const fullHand = sortHand([...existingHand, ...phase2Cards]);
      match.playerHands.set(p.playerId, fullHand);

      const initialCards = match.initialDealtCards.get(p.playerId) || [];
      match.initialDealtCards.set(p.playerId, [...initialCards, ...phase2Cards]);

      cardIdx += 4;
    }
    match.remainingDeck = [];

    // Feature 3: Initialize Trick Play!
    const startingPlayerSlot = (match.dealerSlot % match.mode) + 1;
    match.currentTrick = {
      trickNumber: 1,
      leaderSlot: startingPlayerSlot,
      turnSlot: startingPlayerSlot,
      baseSuit: null,
      cardsPlayed: [],
      revealedInThisTrick: false
    };
    match.tricksWon = { teamA: 0, teamB: 0 };
    match.completedTricks = [];
    match.phase = 'trick_play';

    return match;
  }

  // Feature 3: Reveal Trump
  revealTrump({ roomCode, playerId }) {
    const match = this.getMatch(roomCode);
    if (!match) throw new Error('Active match not found');
    if (match.phase !== 'trick_play') throw new Error('Not currently in trick play');
    if (match.isTrumpRevealed) throw new Error('Trump has already been revealed');

    const player = match.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not in this match');

    if (player.slotNumber !== match.currentTrick.turnSlot) {
      throw new Error(`It is not your turn to reveal trump (Waiting on Slot ${match.currentTrick.turnSlot})`);
    }

    const baseSuit = match.currentTrick.baseSuit;
    if (!baseSuit) {
      throw new Error('Cannot reveal trump as the opening play of a trick');
    }

    // Rule 2: May only reveal if and only if void in Base Suit
    const hand = match.playerHands.get(playerId) || [];
    const hasBaseSuit = hand.some(c => !c.isJoker && c.suit === baseSuit);
    if (hasBaseSuit) {
      throw new Error('You cannot reveal Trump while holding cards of the Base Suit');
    }

    match.isTrumpRevealed = true;
    match.trumpRevealerSlot = player.slotNumber;
    match.currentTrick.revealedInThisTrick = true;

    // Check Match Dissolution Rule (Point 2 / Rule 4):
    // "on revealing the trump card, if opposite team of trump chooser got 0 trump suit cards from start, match dissolves"
    const isDissolved = this.checkDissolutionCondition(match);
    if (isDissolved) {
      match.phase = 'match_dissolved';
      match.dissolutionReason = 'Match Dissolved: The opposing team received 0 cards of the Trump suit from the start.';
      return match;
    }

    // Post-Reveal constraint:
    // If the revealing player holds any trump cards, bound to play a trump card!
    const hasTrump = hand.some(c => !c.isJoker && c.suit === match.trickSuit);
    if (hasTrump) {
      match.boundToTrumpSuitForPlayerId = playerId;
    }

    return match;
  }

  // Feature 3: Play Card
  playCard({ roomCode, playerId, cardId }) {
    const match = this.getMatch(roomCode);
    if (!match) throw new Error('Active match not found');
    if (match.phase !== 'trick_play') throw new Error('Not currently in trick play');
    if (match.currentTrick && match.currentTrick.isResolving) {
      throw new Error('Round is currently resolving, please wait...');
    }

    const player = match.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not in match');

    if (player.slotNumber !== match.currentTrick.turnSlot) {
      throw new Error(`Not your turn to play (Waiting on Slot ${match.currentTrick.turnSlot})`);
    }

    const hand = match.playerHands.get(playerId) || [];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not found in your hand');
    }

    let cardToPlay = { ...hand[cardIndex] };
    const trickNumber = match.currentTrick.trickNumber;
    const isOpeningCard = match.currentTrick.cardsPlayed.length === 0;

    // --- RULE VALIDATIONS ---

    // 1. Joker Rules (v1.1)
    if (cardToPlay.isJoker) {
      // Trick 1 Prohibition: Joker cannot be played at all in Trick 1
      if (trickNumber === 1) {
        throw new Error('The Joker cannot be played in Round 1 of the match (Rule 5)');
      }

      // Tricks 2-7: Cannot lead/open to establish Base Suit
      if (trickNumber >= 2 && trickNumber <= 7 && isOpeningCard) {
        throw new Error('The Joker cannot be played as the opening card of a round to establish Base Suit (Rule 5)');
      }

      // Trick 8: Degradation to 7 of Spades
      if (trickNumber === 8) {
        cardToPlay = {
          ...cardToPlay,
          suit: 'SPADES',
          rank: 7,
          label: '7♠',
          symbol: '♠',
          color: 'black',
          isDegradedJoker: true
        };
      }
    }

    // 2. Base Suit following rules (for non-Joker or degraded Joker)
    if (!isOpeningCard && !cardToPlay.isJoker) {
      const baseSuit = match.currentTrick.baseSuit;
      const hasBaseSuit = hand.some(c => !c.isJoker && c.suit === baseSuit);

      if (hasBaseSuit && cardToPlay.suit !== baseSuit) {
        throw new Error(`You must follow the Base Suit (${baseSuit})`);
      }
    }

    // 3. Post-Reveal Bound Constraint
    if (match.boundToTrumpSuitForPlayerId === playerId) {
      if (cardToPlay.suit !== match.trickSuit) {
        throw new Error(`You revealed the Trump suit and must play a ${match.trickSuit} card!`);
      }
      match.boundToTrumpSuitForPlayerId = null; // fulfilled
    }

    // Remove card from hand
    hand.splice(cardIndex, 1);
    match.playerHands.set(playerId, hand);

    // If opening card, establish Base Suit
    if (isOpeningCard) {
      match.currentTrick.baseSuit = cardToPlay.suit;
    }

    // Record card in trick
    match.currentTrick.cardsPlayed.push({
      slotNumber: player.slotNumber,
      playerId: player.playerId,
      nickname: player.nickname,
      team: player.slotNumber % 2 === 1 ? 'A' : 'B',
      card: cardToPlay
    });

    // Check if trick is complete
    if (match.currentTrick.cardsPlayed.length === match.mode) {
      this.evaluateAndPrepareTrickCompletion(match);
    } else {
      // Advance to next clockwise slot
      match.currentTrick.turnSlot = (match.currentTrick.turnSlot % match.mode) + 1;
    }

    return match;
  }

  // Feature 3: Evaluate Trick Winner and mark resolving for 1-2 second animation
  evaluateAndPrepareTrickCompletion(match) {
    const trick = match.currentTrick;
    const cards = trick.cardsPlayed;

    let winningPlay = cards[0];

    for (let i = 1; i < cards.length; i++) {
      const candidate = cards[i];

      // Case A: Full-power Joker (Tricks 2-7) unconditionally beats any other card
      if (candidate.card.isJoker && !candidate.card.isDegradedJoker) {
        winningPlay = candidate;
        continue;
      }
      if (winningPlay.card.isJoker && !winningPlay.card.isDegradedJoker) {
        continue; // Current winner is already Joker
      }

      // Case B: Trump comparison (if trump is revealed and not Joker No-Trump)
      if (match.isTrumpRevealed && match.trickSuit && match.trickSuit !== 'JOKER') {
        const candidateIsTrump = candidate.card.suit === match.trickSuit;
        const winnerIsTrump = winningPlay.card.suit === match.trickSuit;

        if (candidateIsTrump && !winnerIsTrump) {
          winningPlay = candidate;
          continue;
        }
        if (candidateIsTrump && winnerIsTrump) {
          if (candidate.card.rank > winningPlay.card.rank) {
            winningPlay = candidate;
          }
          continue;
        }
        if (!candidateIsTrump && winnerIsTrump) {
          continue;
        }
      }

      // Case C: Base Suit comparison
      if (candidate.card.suit === trick.baseSuit && winningPlay.card.suit === trick.baseSuit) {
        if (candidate.card.rank > winningPlay.card.rank) {
          winningPlay = candidate;
        }
      }
    }

    trick.isResolving = true;
    trick.winner = winningPlay;
    return winningPlay;
  }

  // Called after the 1-2 second draw animation completes to transition to the next trick/match
  finalizeCompletedTrick(match) {
    const trick = match.currentTrick;
    if (!trick || !trick.isResolving) return;

    const winningPlay = trick.winner;
    const trickNumber = trick.trickNumber;
    const cards = trick.cardsPlayed;

    // Winning team gets the trick
    const winningTeam = winningPlay.team;
    if (winningTeam === 'A') {
      match.tricksWon.teamA += 1;
    } else {
      match.tricksWon.teamB += 1;
    }

    match.completedTricks.push({
      trickNumber,
      baseSuit: trick.baseSuit,
      cardsPlayed: [...cards],
      winningSlot: winningPlay.slotNumber,
      winningPlayerId: winningPlay.playerId,
      winningTeam,
      winningCard: winningPlay.card
    });

    // Check if match ended (after 8 tricks)
    if (trickNumber === 8) {
      this.resolveCompletedMatch(match);
    } else {
      // Set up next trick
      match.currentTrick = {
        trickNumber: trickNumber + 1,
        leaderSlot: winningPlay.slotNumber,
        turnSlot: winningPlay.slotNumber,
        baseSuit: null,
        cardsPlayed: [],
        revealedInThisTrick: false,
        lastWinner: winningPlay,
        isResolving: false,
        winner: null
      };
    }
  }

  // Feature 3: Match End & Scoring Resolution (Rule 3 & 4)
  resolveCompletedMatch(match) {
    const contractTeam = match.contractTeam;
    const finalBid = match.finalBid;
    const tricksWonByContract = contractTeam === 'A' ? match.tricksWon.teamA : match.tricksWon.teamB;

    let pointsDelta = 0;
    let isSuccess = false;

    if (tricksWonByContract >= finalBid) {
      // Success: +bid points
      isSuccess = true;
      pointsDelta = finalBid;
    } else {
      // Loss: -(2 * bid) points penalty
      isSuccess = false;
      pointsDelta = -(2 * finalBid);
    }

    if (contractTeam === 'A') {
      match.teamScores.teamA += pointsDelta;
    } else {
      match.teamScores.teamB += pointsDelta;
    }

    match.matchResult = {
      contractTeam,
      finalBid,
      tricksWonByContract,
      isSuccess,
      pointsDelta,
      teamAScore: match.teamScores.teamA,
      teamBScore: match.teamScores.teamB
    };

    // Persist cumulative scores to DB
    try {
      db.prepare(`
        UPDATE rooms
        SET team_a_score = ?, team_b_score = ?, dealer_slot = ?, match_count = match_count + 1
        WHERE id = ?
      `).run(match.teamScores.teamA, match.teamScores.teamB, (match.dealerSlot % match.mode) + 1, match.roomCode);

      // Store in match_history (Rule 30)
      const matchHistoryId = `hist_${Date.now()}`;
      db.prepare(`
        INSERT INTO match_history (id, room_id, mode, team_a_score, team_b_score, winner_team, bids_summary, match_duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, 60)
      `).run(
        matchHistoryId,
        match.roomCode,
        match.mode,
        match.teamScores.teamA,
        match.teamScores.teamB,
        match.teamScores.teamA > match.teamScores.teamB ? 'A' : (match.teamScores.teamB > match.teamScores.teamA ? 'B' : 'TIE'),
        JSON.stringify(match.matchResult)
      );
    } catch (err) {
      console.error('DB Update Match Score Error:', err.message);
    }

    if (match.endGameRequested) {
      match.phase = 'game_over';
    } else {
      match.phase = 'match_ended';
    }
  }

  // Audits opposing team for Trump Dissolution rule
  checkDissolutionCondition(match) {
    if (!match || !match.trickSuit || match.trickSuit === 'JOKER') {
      return false;
    }

    const contractTeam = match.contractTeam;
    const opposingTeam = contractTeam === 'A' ? 'B' : 'A';
    const opposingPlayers = match.players.filter(p => (p.slotNumber % 2 === 1 ? 'A' : 'B') === opposingTeam);

    let opposingTrumpCount = 0;
    for (const opp of opposingPlayers) {
      const fullDealt = match.initialDealtCards.get(opp.playerId) || [];
      const trumps = fullDealt.filter(c => c.suit === match.trickSuit);
      opposingTrumpCount += trumps.length;
    }

    return opposingTrumpCount === 0;
  }

  // Sanitized state serialization for clients
  getPublicState(roomCode, forPlayerId) {
    const match = this.getMatch(roomCode);
    if (!match) return null;

    const playerHand = match.playerHands.get(forPlayerId) || [];
    const isContractPlayer = match.contractPlayerId === forPlayerId;

    const displayTrickSuit = (match.isTrumpRevealed || isContractPlayer)
      ? match.trickSuit
      : (match.trickSuit ? 'HIDDEN' : null);

    return {
      matchId: match.matchId,
      roomCode: match.roomCode,
      mode: match.mode,
      phase: match.phase,
      dealerSlot: match.dealerSlot,
      currentBidderSlot: match.currentBidderSlot,
      currentHighestBid: match.currentHighestBid,
      highestBidderSlot: match.highestBidderSlot,
      passedSlots: Array.from(match.passedSlots),
      contract: match.contractPlayerSlot ? {
        contractPlayerSlot: match.contractPlayerSlot,
        contractTeam: match.contractTeam,
        finalBid: match.finalBid,
        trickSuit: displayTrickSuit,
        isTrumpRevealed: match.isTrumpRevealed,
        isContractPlayer,
        trumpRevealerSlot: match.trumpRevealerSlot
      } : null,
      // Feature 3: Trick State
      currentTrick: match.currentTrick ? {
        trickNumber: match.currentTrick.trickNumber,
        leaderSlot: match.currentTrick.leaderSlot,
        turnSlot: match.currentTrick.turnSlot,
        baseSuit: match.currentTrick.baseSuit,
        cardsPlayed: match.currentTrick.cardsPlayed,
        lastWinner: match.currentTrick.lastWinner || null,
        isResolving: Boolean(match.currentTrick.isResolving),
        winner: match.currentTrick.winner || null
      } : null,
      tricksWon: match.tricksWon,
      completedTricksCount: match.completedTricks.length,
      matchResult: match.matchResult || null,
      dissolutionReason: match.dissolutionReason || null,
      // Players info
      players: match.players.map(p => {
        const hand = match.playerHands.get(p.playerId) || [];
        return {
          playerId: p.playerId,
          nickname: p.nickname,
          slotNumber: p.slotNumber,
          team: p.slotNumber % 2 === 1 ? 'A' : 'B',
          isDealer: p.slotNumber === match.dealerSlot,
          isCurrentBidder: p.slotNumber === match.currentBidderSlot && match.phase === 'bidding',
          isCurrentTurn: match.currentTrick && p.slotNumber === match.currentTrick.turnSlot && match.phase === 'trick_play',
          hasPassed: match.passedSlots.has(p.slotNumber),
          cardCount: hand.length,
          isConnected: p.isConnected,
          isBot: Boolean(p.isBot)
        };
      }),
      myHand: playerHand,
      teamScores: match.teamScores,
      endGameRequested: match.endGameRequested
    };
  }
}

module.exports = new MatchEngine();
