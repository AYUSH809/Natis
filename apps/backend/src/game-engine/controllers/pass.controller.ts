import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";

import { BiddingEngine } from "./engines/bidding.engine";

import { io } from "../socket/socket.server";

export class PassController {
    static async passBid(
        req: Request,
        res: Response
    ) {
        try {
            const {
                roomCode,
                playerId,
            } = req.body;

            const gameState =
                await GameStateService.getGameState(
                    roomCode
                );

            if (!gameState) {
                throw new Error(
                    "Game not found"
                );
            }

            BiddingEngine.passBid(
                gameState,
                playerId
            );

            await GameStateService.saveGameState(
                roomCode,
                gameState
            );

            io.to(roomCode).emit(
                "bid_updated",
                {
                    highestBid:
                        gameState.highestBid,

                    highestBidderId:
                        gameState.highestBidderId,

                    currentBidderId:
                        gameState.currentBidderId,

                    bidHistory:
                        gameState.bidHistory,
                }
            );

            return res.json(
                gameState
            );
        } catch (error: any) {
            return res.status(400).json({
                message:
                    error.message,
            });
        }
    }
}