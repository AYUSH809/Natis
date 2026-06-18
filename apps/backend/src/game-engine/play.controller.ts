import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";

import { io } from "../socket/socket.server";

export class PlayController {
    static async playCard(
        req: Request,
        res: Response
    ) {
        try {
            const {
                roomCode,
                playerId,
                cardId,
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
                gameState.currentPlayerTurn !==
                playerId
            ) {
                throw new Error(
                    "Not your turn"
                );
            }

            const player =
                gameState.players.find(
                    p => p.userId === playerId
                );

            if (!player) {
                throw new Error(
                    "Player not found"
                );
            }

            const cardIndex =
                player.cards.findIndex(
                    card => card.id === cardId
                );

            if (cardIndex === -1) {
                throw new Error(
                    "Card not found"
                );
            }

            const playedCard =
                player.cards.splice(
                    cardIndex,
                    1
                )[0];

            gameState.tableCards.push({
                playerId,
                card: playedCard,
            });

            const currentIndex =
                gameState.players.findIndex(
                    p =>
                        p.userId ===
                        playerId
                );

            const nextIndex =
                (currentIndex + 1) %
                gameState.players.length;

            gameState.currentPlayerTurn =
                gameState.players[
                    nextIndex
                ].userId;

            await GameStateService.saveGameState(
                roomCode,
                gameState
            );

            io.to(roomCode).emit(
                "card_played",
                {
                    playerId,

                    card: playedCard,

                    tableCards:
                        gameState.tableCards,

                    currentPlayerTurn:
                        gameState.currentPlayerTurn,
                }
            );

            return res.json({
                success: true,
                card: playedCard,
            });

        } catch (error: any) {
            return res.status(400).json({
                message:
                    error.message,
            });
        }
    }
}