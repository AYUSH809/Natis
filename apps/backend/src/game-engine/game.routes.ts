import { Router } from "express";

import { GameController } from "./game.controller";

import { BidController } from "./bid.controller";

//import { PassController } from "./pass.controller";

import { TrickController } from "./trick.controller";

import { PlayController } from "./play.controller";

const router = Router();

router.post(
    "/start",
    GameController.startMatch
);

router.post(
    "/bid",
    BidController.placeBid
);

// router.post(
//     "/pass",
//     PassController.passBid
//);

router.post(
    "/select-suit",
    TrickController.selectSuit
);

router.post(
    "/play-card",
    PlayController.playCard
);

export default router;