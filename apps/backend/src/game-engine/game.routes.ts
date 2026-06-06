import { Router } from "express";

import { GameController } from "./game.controller";

const router = Router();

router.post(
    "/start",
    GameController.startMatch
);

export default router;