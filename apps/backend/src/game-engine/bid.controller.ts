import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";

import { BiddingEngine } from "./engines/bidding.engine";

import { io } from "../socket/socket.server";

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

            BiddingEngine.placeBid(
                gameState,
                playerId,
                bid
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

            res.json(
                gameState
            );
        } catch (error: any) {
            res.status(400).json({
                message:
                    error.message,
            });
        }
    }
}