// NATIS Deck Generator and Shuffler
// 4 Players: 32 Cards (Hearts A-7, Clubs A-7, Diamonds A-7, Spades A-8 + 1 Joker)
// 6 Players: 48 Cards (Hearts A-3, Clubs A-3, Diamonds A-3, Spades A-4 + 1 Joker)

const SUITS = {
  HEARTS: 'HEARTS',
  CLUBS: 'CLUBS',
  DIAMONDS: 'DIAMONDS',
  SPADES: 'SPADES'
};

const SUIT_SYMBOLS = {
  HEARTS: '♥',
  CLUBS: '♣',
  DIAMONDS: '♦',
  SPADES: '♠',
  JOKER: '🃏'
};

const SUIT_COLORS = {
  HEARTS: 'red',
  DIAMONDS: 'red',
  CLUBS: 'black',
  SPADES: 'black',
  JOKER: 'purple'
};

// Ranks: 2 to 14 (14 = Ace)
const RANK_LABELS = {
  14: 'A',
  13: 'K',
  12: 'Q',
  11: 'J',
  10: '10',
  9: '9',
  8: '8',
  7: '7',
  6: '6',
  5: '5',
  4: '4',
  3: '3',
  2: '2',
  99: 'JOKER'
};

function generateDeck(mode = 4) {
  const cards = [];

  if (mode === 6) {
    // 6-Player mode: 48 cards total
    // Hearts, Clubs, Diamonds: A - 3 (12 cards each = 36 cards)
    for (const suit of [SUITS.HEARTS, SUITS.CLUBS, SUITS.DIAMONDS]) {
      for (let rank = 14; rank >= 3; rank--) {
        cards.push({
          id: `${suit}_${rank}`,
          suit,
          rank,
          label: RANK_LABELS[rank],
          symbol: SUIT_SYMBOLS[suit],
          color: SUIT_COLORS[suit],
          isJoker: false
        });
      }
    }
    // Spades: A - 4 (11 cards)
    for (let rank = 14; rank >= 4; rank--) {
      cards.push({
        id: `SPADES_${rank}`,
        suit: SUITS.SPADES,
        rank,
        label: RANK_LABELS[rank],
        symbol: SUIT_SYMBOLS[SUITS.SPADES],
        color: SUIT_COLORS[SUITS.SPADES],
        isJoker: false
      });
    }
    // 1 Joker
    cards.push({
      id: 'JOKER',
      suit: 'JOKER',
      rank: 99,
      label: 'JK',
      symbol: SUIT_SYMBOLS.JOKER,
      color: SUIT_COLORS.JOKER,
      isJoker: true
    });
  } else {
    // 4-Player mode: 32 cards total
    // Hearts, Clubs, Diamonds: A - 7 (8 cards each = 24 cards)
    for (const suit of [SUITS.HEARTS, SUITS.CLUBS, SUITS.DIAMONDS]) {
      for (let rank = 14; rank >= 7; rank--) {
        cards.push({
          id: `${suit}_${rank}`,
          suit,
          rank,
          label: RANK_LABELS[rank],
          symbol: SUIT_SYMBOLS[suit],
          color: SUIT_COLORS[suit],
          isJoker: false
        });
      }
    }
    // Spades: A - 8 (7 cards)
    for (let rank = 14; rank >= 8; rank--) {
      cards.push({
        id: `SPADES_${rank}`,
        suit: SUITS.SPADES,
        rank,
        label: RANK_LABELS[rank],
        symbol: SUIT_SYMBOLS[SUITS.SPADES],
        color: SUIT_COLORS[SUITS.SPADES],
        isJoker: false
      });
    }
    // 1 Joker
    cards.push({
      id: 'JOKER',
      suit: 'JOKER',
      rank: 99,
      label: 'JK',
      symbol: SUIT_SYMBOLS.JOKER,
      color: SUIT_COLORS.JOKER,
      isJoker: true
    });
  }

  return cards;
}

// Fisher-Yates cryptographically-solid shuffle
function shuffle(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to sort a player's hand by suit and descending rank
function sortHand(hand) {
  const suitOrder = { HEARTS: 1, SPADES: 2, DIAMONDS: 3, CLUBS: 4, JOKER: 5 };
  return [...hand].sort((a, b) => {
    if (a.isJoker) return 1;
    if (b.isJoker) return -1;
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.rank - a.rank;
  });
}

module.exports = {
  SUITS,
  SUIT_SYMBOLS,
  SUIT_COLORS,
  RANK_LABELS,
  generateDeck,
  shuffle,
  sortHand
};
