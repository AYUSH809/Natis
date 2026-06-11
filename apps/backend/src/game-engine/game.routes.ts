import { Router } from "express";

import { GameController } from "./game.controller";

import { BidController } from "./bid.controller";

const router = Router();

router.post(
    "/start",
    GameController.startMatch
);

router.post(
    "/bid",
    BidController.placeBid
);

export default router;