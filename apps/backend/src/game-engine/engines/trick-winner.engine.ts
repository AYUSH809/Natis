import {
    Card,
    Suit,
} from "../types/card.types";

export class TrickWinnerEngine {
    static determineWinner(
        cards: {
            playerId: string;
            card: Card;
        }[],
        trumpSuit?: Suit
    ) {
        if (cards.length === 0) {
            throw new Error(
                "Cannot determine a winner without played cards"
            );
        }

        const leadSuitCard =
            cards.find(
                (entry) =>
                    entry.card.suit !==
                    "JOKER"
            );

        const leadSuit =
            leadSuitCard?.card.suit;
        const noTrumpMode =
            trumpSuit === "JOKER";

        let winningCards =
            leadSuit
                ? cards.filter(
                    (entry) =>
                        entry.card.suit ===
                        leadSuit
                )
                : cards;

        if (!noTrumpMode) {
            const jokerCard =
                cards.find(
                    (entry) =>
                        entry.card.suit ===
                        "JOKER"
                );

            if (jokerCard) {
                return jokerCard.playerId;
            }

            const trumpCards =
                trumpSuit
                    ? cards.filter(
                        (entry) =>
                            entry.card.suit ===
                            trumpSuit
                    )
                    : [];

            if (trumpCards.length > 0) {
                winningCards =
                    trumpCards;
            }
        }

        const winner =
            winningCards.reduce(
                (best, entry) =>
                    entry.card.value >
                        best.card.value
                        ? entry
                        : best
            );

        return winner.playerId;
    }
}
