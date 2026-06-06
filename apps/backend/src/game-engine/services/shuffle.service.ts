import { Card } from "../types/card.types";

export class ShuffleService {
    static shuffle(
        deck: Card[]
    ): Card[] {
        const shuffled = [...deck];

        for (
            let i = shuffled.length - 1;
            i > 0;
            i--
        ) {
            const j = Math.floor(
                Math.random() * (i + 1)
            );

            [shuffled[i], shuffled[j]] = [
                shuffled[j],
                shuffled[i],
            ];
        }

        return shuffled;
    }
}