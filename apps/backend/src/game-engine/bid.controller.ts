import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";
import { io } from "../socket/socket.server";

import { BiddingEngine } from "./engines/bidding.engine";
import { GamePayloadService } from "./services/game-payload.service";

export class BidController {
    static async placeBid(
        req: Request,
        res: Response
    ) {
        try {
            const {
                roomCode,
                playerId,
                bid,
            } = req.body ?? {};

            if (
                typeof roomCode !==
                "string" ||
                typeof playerId !==
                "string" ||
                typeof bid !== "number"
            ) {
                throw new Error(
                    "Invalid bid payload"
                );
            }

            const gameState =
                await GameStateService.getGameState(
                    roomCode
                );

            if (!gameState) {
                throw new Error(
                    "Game not found"
                );
            }

            BiddingEngine.placeBid(
                gameState,
                playerId,
                bid
            );

            await GameStateService.saveGameState(
                roomCode,
                gameState
            );

            for (const player of gameState.players) {

                io.to(player.socketId).emit(

                    "bid_updated",

                    GamePayloadService.buildPlayerState(

                        gameState,

                        player.userId

                    )

                );

            }

            return res.json(gameState);
        } catch (error: any) {
            return res.status(400).json({
                message:
                    error.message,
            });
        }
    }
}
