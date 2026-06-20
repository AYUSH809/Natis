import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";
import { io } from "../socket/socket.server";

import { BiddingEngine } from "./engines/bidding.engine";

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
                    phase:
                        gameState.phase,
                    winningBidderId:
                        gameState.winningBidderId,
                    winningBid:
                        gameState.winningBid,
                    biddingTeam:
                        gameState.biddingTeam,
                    allHand:
                        gameState.allHand,
                }
            );

            return res.json(gameState);
        } catch (error: any) {
            return res.status(400).json({
                message:
                    error.message,
            });
        }
    }
}
