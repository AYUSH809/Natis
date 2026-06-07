import { Card } from "../types/card.types";
import { PlayerHand } from "../types/game.types";

export class DealService {
    static initialDeal(
        players: PlayerHand[],
        deck: Card[]
    ): {
        players: PlayerHand[];
        remainingDeck: Card[];
    } {
        const workingDeck = [...deck];

        for (let round = 0; round < 5; round++) {
            for (const player of players) {
                const card = workingDeck.shift();

                if (card) {
                    player.cards.push(card as unknown as any);
                }
            }
        }

        return {
            players,
            remainingDeck: workingDeck,
        };
    }
}