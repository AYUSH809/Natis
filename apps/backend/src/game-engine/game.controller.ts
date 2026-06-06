import { Request, Response } from "express";

import { GameService } from "./game.service";

export class GameController {
    static async startMatch(
        req: Request,
        res: Response
    ) {
        try {
            const { roomCode } =
                req.body;

            const gameState =
                await GameService.startMatch(
                    roomCode
                );

            return res.json(gameState);
        } catch (error: any) {
            console.error(
                "START MATCH ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    error.message ||
                    "Failed to start match",
            });
        }
    }
}