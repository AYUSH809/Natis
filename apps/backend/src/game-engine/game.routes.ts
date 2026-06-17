import { Router } from "express";

import { GameController } from "./game.controller";

import { BidController } from "./bid.controller";

import { PassController } from "./controllers/pass.controller";

const router = Router();

router.post(
    "/start",
    GameController.startMatch
);

router.post(
    "/bid",
    BidController.placeBid
);

router.post(
    "/pass",
    PassController.passBid
);

export default router;