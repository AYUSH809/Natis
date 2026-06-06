import { Router } from "express";

import { DeckService } from "../game-engine/services/deck.service";

const router = Router();

router.get(
    "/deck/:players",
    (
        req,
        res
    ) => {
        const deck =
            DeckService.generateDeck(
                Number(
                    req.params.players
                )
            );

        res.json({
            totalCards:
                deck.length,
            deck,
        });
    }
);

export default router;