// NATIS AI Bot Engine
// Provides tactical decisions for Bidding, Trump Selection, and Card Play

const { sortHand } = require('./deck');

class BotEngine {
  // Evaluates Phase 1 hand (4 cards) to decide bid (5..8 or PASS)
  decideBid(botHand, currentHighestBid) {
    // Count high cards and suit distribution
    let strength = 0;
    const suitCounts = { HEARTS: 0, CLUBS: 0, DIAMONDS: 0, SPADES: 0 };

    for (const card of botHand) {
      if (card.isJoker) {
        strength += 3; // Joker is powerful
      } else {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        if (card.rank === 14) strength += 2.5; // Ace
        else if (card.rank === 13) strength += 1.5; // King
        else if (card.rank === 12) strength += 0.8; // Queen
      }
    }

    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount >= 3) strength += 1.5; // Strong trump candidate

    // Calculate maximum realistic bid
    let estimatedBid = null;
    if (strength >= 7) estimatedBid = 7;
    else if (strength >= 5.5) estimatedBid = 6;
    else if (strength >= 4) estimatedBid = 5;

    if (!estimatedBid) return 'PASS';

    if (currentHighestBid === null) {
      return estimatedBid >= 5 ? 5 : 'PASS';
    }

    if (estimatedBid > currentHighestBid && estimatedBid <= 8) {
      return currentHighestBid + 1;
    }

    return 'PASS';
  }

  // Selects Trump based on Phase 1 hand
  decideTrumpSuit(botHand) {
    const suitCounts = { HEARTS: 0, CLUBS: 0, DIAMONDS: 0, SPADES: 0 };
    const suitStrengths = { HEARTS: 0, CLUBS: 0, DIAMONDS: 0, SPADES: 0 };

    for (const card of botHand) {
      if (!card.isJoker) {
        suitCounts[card.suit] += 1;
        suitStrengths[card.suit] += card.rank;
      }
    }

    // Pick suit with most cards, tie-break by strength
    let bestSuit = 'HEARTS';
    let maxCount = -1;
    let maxStrength = -1;

    for (const suit of ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']) {
      const count = suitCounts[suit];
      const strength = suitStrengths[suit];
      if (count > maxCount || (count === maxCount && strength > maxStrength)) {
        bestSuit = suit;
        maxCount = count;
        maxStrength = strength;
      }
    }

    return bestSuit;
  }

  // Decides whether to reveal Trump if void in Base Suit
  shouldRevealTrump(botHand, currentTrick, isTrumpRevealed, trickSuit) {
    if (isTrumpRevealed || !trickSuit) return false;
    const baseSuit = currentTrick.baseSuit;
    if (!baseSuit) return false;

    // Must be void in Base Suit to reveal
    const hasBaseSuit = botHand.some(c => !c.isJoker && c.suit === baseSuit);
    if (hasBaseSuit) return false;

    // Check if bot holds any trump card
    const hasTrump = botHand.some(c => !c.isJoker && c.suit === trickSuit);
    return hasTrump; // Reveal to cut the trick with Trump!
  }

  // Selects legal card to play from hand
  decideCardToPlay(botHand, currentTrick, isTrumpRevealed, trickSuit, trickNumber) {
    const baseSuit = currentTrick.baseSuit;
    const isOpeningCard = !baseSuit || currentTrick.cardsPlayed.length === 0;

    // 1. If Opening the trick:
    if (isOpeningCard) {
      // In Trick 1: Joker cannot be played.
      // In Tricks 2-7: Joker cannot establish Base Suit.
      // So opening card must be a non-Joker card if available!
      const nonJokers = botHand.filter(c => !c.isJoker);
      if (nonJokers.length > 0) {
        // Open with an Ace or high card
        const aces = nonJokers.filter(c => c.rank === 14);
        if (aces.length > 0) return aces[0];
        // Otherwise play highest of strongest suit
        return nonJokers[0];
      }
      return botHand[0];
    }

    // 2. Following a trick:
    const hasBaseSuit = botHand.some(c => !c.isJoker && c.suit === baseSuit);

    // If holds Base Suit:
    if (hasBaseSuit) {
      const baseCards = botHand.filter(c => !c.isJoker && c.suit === baseSuit);
      // Play highest base card to win or lowest to duck
      return baseCards[0];
    }

    // If void in Base Suit:
    // Can play Joker (except Trick 1)
    if (trickNumber > 1) {
      const jokerCard = botHand.find(c => c.isJoker);
      if (jokerCard) {
        // Save Joker unless opponents are winning heavily
        return jokerCard;
      }
    }

    // If Trump is revealed and bot has Trump, play Trump
    if (isTrumpRevealed && trickSuit) {
      const trumpCards = botHand.filter(c => !c.isJoker && c.suit === trickSuit);
      if (trumpCards.length > 0) {
        return trumpCards[trumpCards.length - 1]; // Play lowest trump to win
      }
    }

    // Discard lowest non-valuable card
    const nonJokers = botHand.filter(c => !c.isJoker);
    if (nonJokers.length > 0) {
      return nonJokers[nonJokers.length - 1];
    }

    return botHand[0];
  }
}

module.exports = new BotEngine();
