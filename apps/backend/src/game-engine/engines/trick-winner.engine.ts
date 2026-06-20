import { Card } from "../types/card.types";

export class TrickWinnerEngine {
    static determineWinner(
        cards: {
            playerId: string;
            card: Card;
        }[],
        trumpSuit?: string
    ) {
        let winner =
            cards[0];

        for (const entry of cards) {
            if (
                entry.card.suit ===
                trumpSuit &&
                winner.card.suit !==
                trumpSuit
            ) {
                winner = entry;
            }

            if (
                entry.card.suit ===
                winner.card.suit &&
                entry.card.value >
                winner.card.value
            ) {
                winner = entry;
            }
        }

        return winner.playerId;
    }
}