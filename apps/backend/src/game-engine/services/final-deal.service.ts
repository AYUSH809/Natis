import { Card, PlayerHand } from "../types/game.types";

export class FinalDealService {
    static distributeRemainingCards(
        players: PlayerHand[],
        deck: Card[]
    ) {
        const workingDeck = [...deck];

        while (
            workingDeck.length > 0
        ) {
            for (const player of players) {
                const card =
                    workingDeck.shift();

                if (!card) {
                    break;
                }

                player.cards.push(card);
            }
        }

        return {
            players,
            remainingDeck: [],
        };
    }
}