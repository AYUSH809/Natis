import React from 'react';
import CardView from './CardView';

export default function HandView({
  hand = [],
  phase,
  currentTrick,
  isMyTurn,
  boundToTrumpSuit,
  onPlayCard
}) {
  if (!hand || hand.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-500 italic">
        No cards in hand.
      </div>
    );
  }

  const isPhase1 = hand.length === 4 && phase === 'bidding';
  const trickNumber = currentTrick?.trickNumber || 1;
  const isOpening = !currentTrick?.baseSuit || currentTrick?.cardsPlayed?.length === 0;
  const baseSuit = currentTrick?.baseSuit;

  // Determine if each card is legally playable on your turn
  const isCardPlayable = (card) => {
    if (phase !== 'trick_play' || !isMyTurn) return false;

    // 1. Joker Rules
    if (card.isJoker) {
      if (trickNumber === 1) return false; // Rule 5: Cannot play Joker in Trick 1
      if (trickNumber >= 2 && trickNumber <= 7 && isOpening) return false; // Rule 5: Cannot open with Joker
      return true; // Tricks 2-7 can follow at any time
    }

    // 2. Base Suit following rules
    if (!isOpening) {
      const hasBaseSuit = hand.some(c => !c.isJoker && c.suit === baseSuit);
      if (hasBaseSuit && card.suit !== baseSuit) {
        return false; // Must follow base suit
      }
    }

    // 3. Post-Reveal Bound to Trump
    if (boundToTrumpSuit && card.suit !== boundToTrumpSuit) {
      return false;
    }

    return true;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {isPhase1 ? '🃏 Phase 1 Deal (4 Cards - Review to Bid)' : `🎴 Your Hand (${hand.length} Cards)`}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap py-2">
        {hand.map((card) => {
          const playable = isCardPlayable(card);

          return (
            <div
              key={card.id}
              className={`transition-all ${
                phase === 'trick_play' && isMyTurn
                  ? playable
                    ? 'ring-2 ring-emerald-400 rounded-lg cursor-pointer transform hover:-translate-y-2'
                    : 'opacity-40 grayscale-[40%] cursor-not-allowed'
                  : ''
              }`}
            >
              <CardView
                card={card}
                isPlayable={playable}
                onClick={() => playable && onPlayCard && onPlayCard(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
