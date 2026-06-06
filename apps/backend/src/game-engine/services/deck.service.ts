import { Card } from "../types/card.types";

export class DeckService {
    static generateDeck(
        maxPlayers: number
    ): Card[] {
        if (maxPlayers === 4) {
            return this.generate4PlayerDeck();
        }

        return this.generate6PlayerDeck();
    }

    private static generate4PlayerDeck(): Card[] {
        const deck: Card[] = [];

        const suits = [
            "HEARTS",
            "DIAMONDS",
            "CLUBS",
            "SPADES",
        ] as const;

        const ranks = [
            "A",
            "K",
            "Q",
            "J",
            "10",
            "9",
            "8",
            "7",
        ] as const;

        for (const suit of suits) {
            for (const rank of ranks) {
                if (
                    suit === "SPADES" &&
                    rank === "7"
                ) {
                    continue;
                }

                deck.push({
                    id: `${suit}_${rank}`,
                    suit,
                    rank,
                    isJoker: false,
                });
            }
        }

        deck.push({
            id: "JOKER",
            suit: "JOKER",
            rank: "JOKER",
            isJoker: true,
        });

        return deck;
    }

    private static generate6PlayerDeck(): Card[] {
        const deck: Card[] = [];

        const suits = [
            "HEARTS",
            "DIAMONDS",
            "CLUBS",
            "SPADES",
        ] as const;

        const ranks = [
            "A",
            "K",
            "Q",
            "J",
            "10",
            "9",
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
        ] as const;

        for (const suit of suits) {
            for (const rank of ranks) {
                if (
                    suit === "SPADES" &&
                    rank === "3"
                ) {
                    continue;
                }

                deck.push({
                    id: `${suit}_${rank}`,
                    suit,
                    rank,
                    isJoker: false,
                });
            }
        }

        deck.push({
            id: "JOKER",
            suit: "JOKER",
            rank: "JOKER",
            isJoker: true,
        });

        return deck;
    }
}