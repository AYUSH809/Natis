import { Card } from "../types/card.types";

export class DealService {
    static dealInitialCards(
        deck: Card[],
        players: string[]
    ) {
        const hands: Record<
            string,
            Card[]
        > = {};

        players.forEach((player) => {
            hands[player] = [];
        });

        let index = 0;

        for (let round = 0; round < 5; round++) {
            for (const player of players) {
                hands[player].push(
                    deck[index]
                );

                index++;
            }
        }

        return {
            hands,
            remainingDeck:
                deck.slice(index),
        };
    }
}