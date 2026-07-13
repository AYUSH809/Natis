import { Request, Response } from "express";

import { GameStateService } from "../redis/game-state.service";

import { io } from "../socket/socket.server";

import { TrickWinnerEngine } from "./engines/trick-winner.engine";

import { ScoringEngine } from "./engines/scoring.engine";
import { GamePayloadService } from "./services/game-payload.service";

export class PlayController {
  static async playCard(req: Request, res: Response) {
    try {
      const { roomCode, playerId, cardId } = req.body;

      const gameState = await GameStateService.getGameState(roomCode);

      if (!gameState) {
        throw new Error("Game not found");
      }

      if (gameState.matchEnded) {
        throw new Error("Match already ended");
      }

      if (gameState.currentPlayerTurn !== playerId) {
        throw new Error("Not your turn");
      }

      const player = gameState.players.find((p: any) => p.userId === playerId);

      if (
        player?.disabled
      ) {
        throw new Error(
          "Disabled player cannot play"
        );
      }

      if (!player) {
        throw new Error("Player not found");
      }

      const cardIndex = player.cards.findIndex(
        (card: any) => card.id === cardId,
      );

      if (cardIndex === -1) {
        throw new Error("Card not found");
      }

      // CURRENT ROUND
      let currentRound = gameState.rounds[gameState.rounds.length - 1];

      if (!currentRound) {
        throw new Error("Round not initialized");
      }

      // FOLLOW SUIT VALIDATION
      if (currentRound && currentRound.baseSuit) {
        const hasBaseSuit = player.cards.some(
          (card: any) => card.suit === currentRound.baseSuit,
        );

        const selectedCard = player.cards.find(
          (card: any) => card.id === cardId,
        );

        if (hasBaseSuit && selectedCard?.suit !== currentRound.baseSuit) {
          throw new Error("Must follow suit");
        }
      }

      const playedCard = player.cards.splice(cardIndex, 1)[0];

      if (!currentRound.baseSuit) {
        currentRound.baseSuit = playedCard.suit;
      }

      gameState.tableCards.push({
        playerId,
        card: playedCard,
      });

      currentRound.playedCards.push({
        userId: playerId,
        card: playedCard,
      });

      // NEXT PLAYER TURN
      const currentIndex = gameState.players.findIndex(
        (p: any) => p.userId === playerId,
      );

      let nextPlayer;

      for (
        let offset = 1;
        offset <= gameState.players.length;
        offset++
      ) {
        const nextIndex =
          (currentIndex + offset) %
          gameState.players.length;

        const candidate =
          gameState.players[nextIndex];

        if (
          !candidate.disabled
        ) {
          nextPlayer =
            candidate;

          break;
        }
      }
      gameState.currentPlayerTurn = nextPlayer?.userId;

      let trickWinnerId: string | undefined;

      // TRICK COMPLETE
      const activePlayersCount =
        gameState.players.filter(
          (player: any) =>
            !player.disabled
        ).length;

      if (
        gameState.tableCards.length ===
        activePlayersCount
      ) {
        trickWinnerId = TrickWinnerEngine.determineWinner(
          gameState.tableCards,
          gameState.trumpSuit,
        );

        currentRound.winnerId = trickWinnerId;

        const winningPlayer = gameState.players.find(
          (p: any) => p.userId === trickWinnerId,
        );

        if (winningPlayer) {
          winningPlayer.roundsWon++;

          if (winningPlayer.team === "A") {
            gameState.teamATricks++;
          } else {
            gameState.teamBTricks++;
          }
        }

        gameState.currentPlayerTurn = trickWinnerId;

        gameState.tableCards = [];

        gameState.currentRound++;

        if (gameState.currentRound <= 8) {
          gameState.rounds.push({
            roundNumber: gameState.currentRound,

            currentTurn: trickWinnerId,

            baseSuit: undefined,

            playedCards: [],

            winnerId: undefined,
          });
        }

        if (!gameState.matchEnded && gameState.currentRound > 8) {
          gameState.matchEnded = true;

          ScoringEngine.calculateScore(gameState);

          for (const player of gameState.players) {
            io.to(player.socketId).emit(
              "match_ended",
              GamePayloadService.buildPlayerState(
                gameState,
                player.userId,
              ),
            );
          }
        }
      }

      await GameStateService.saveGameState(roomCode, gameState);

      for (const player of gameState.players) {
        io.to(player.socketId).emit(
          "card_played",
          GamePayloadService.buildPlayerState(
            gameState,
            player.userId,
          ),
        );
      }
      return res.json({
        success: true,
        card: playedCard,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }
}
