import {
    Card,
    STANDARD_SUITS,
} from "../types/card.types";

import { MAX_PLAYERS, TOTAL_TRICKS } from "../utils/game-rules";

export class DeckService {
    static generateDeck(
        maxPlayers: number
    ): Card[] {
        if (maxPlayers !== MAX_PLAYERS) {
            throw new Error(
                "Only 4 player matches are supported"
            );
        }

        return this.generate4PlayerDeck();
    }

    private static getCardValue(
        rank: string
    ): number {
        switch (rank) {
            case "A":
                return 14;
            case "K":
                return 13;
            case "Q":
                return 12;
            case "J":
                return 11;
            default:
                return Number(rank);
        }
    }

    private static generate4PlayerDeck() {
        const deck: Card[] = [];
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

        for (const suit of STANDARD_SUITS) {
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
                    value:
                        this.getCardValue(
                            rank
                        ),
                    isJoker: false,
                });
            }
        }

        deck.push({
            id: "JOKER",
            suit: "JOKER",
            rank: "JOKER",
            value: 99,
            isJoker: true,
        });

        const expectedCards =
            MAX_PLAYERS * TOTAL_TRICKS;

        console.log("DECK SIZE =", deck.length);

        console.log("EXPECTED =", expectedCards);

        console.log(
            deck.map(
                card => `${card.rank}-${card.suit}`
            )
        );

        if (
            deck.length !== expectedCards
        ) {
            throw new Error(
                "Invalid 4 player deck size"
            );
        }

        return deck;
    }
}
