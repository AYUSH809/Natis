import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";

import { io } from "../socket/socket.server";

import { FinalDealService } from "./services/final-deal.service";

export class TrickController {
    static async selectSuit(
        req: Request,
        res: Response
    ) {
        try {
            const {
                roomCode,
                playerId,
                suit,
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

            if (
                gameState.winningBidderId !==
                playerId
            ) {
                throw new Error(
                    "Only winning bidder can select suit"
                );
            }

            gameState.selectedSuit =
                suit;

            gameState.trumpSuit =
                suit;

            gameState.currentPlayerTurn =
                gameState.winningBidderId;

            const dealResult =
                FinalDealService
                    .distributeRemainingCards(
                        gameState.players,
                        gameState.deck
                    );

            gameState.players =
                dealResult.players;

            gameState.deck =
                [];

            gameState.phase =
                "PLAYING";

            await GameStateService.saveGameState(
                roomCode,
                gameState
            );

            io.to(roomCode).emit(
                "suit_selected",
                {
                    suit,
                    phase:
                        gameState.phase,
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