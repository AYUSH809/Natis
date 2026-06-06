import { RoomService } from "../room-system/room.service";

import { GameStateService } from "../redis/game-state.service";

import {
    GameState,
    PlayerHand,
} from "./types/game.types";

import { DeckService } from "./deck.service";

import { ShuffleService } from "./shuffle.service";

import { DealService } from "./deal.service";

export class GameService {
    static async startMatch(
        roomCode: string
    ) {
        const room =
            await RoomService.getRoom(
                roomCode
            );

        if (!room) {
            throw new Error(
                "Room not found"
            );
        }

        if (
            room.players.length !==
            room.maxPlayers
        ) {
            throw new Error(
                "Room not full"
            );
        }

        // BUILD DECK
        let deck =
            DeckService.buildDeck(
                room.maxPlayers
            );

        // SHUFFLE
        deck =
            ShuffleService.shuffle(
                deck
            );

        // CREATE PLAYER HANDS
        const players: PlayerHand[] =
            room.players.map((player) => ({
                userId: player.userId,

                username:
                    player.username,

                team: player.team,

                cards: [],

                roundsWon: 0,
            }));

        // INITIAL 5 CARD DEAL
        const dealResult =
            DealService.initialDeal(
                players,
                deck
            );

        const gameState: GameState = {
            roomCode,

            maxPlayers:
                room.maxPlayers,

            players:
                dealResult.updatedPlayers,

            deck:
                dealResult.remainingDeck,

            currentDealerIndex: 0,

            currentBidderIndex: 0,

            trickRevealed: false,

            currentRound: 1,

            rounds: [],

            score: {
                teamA: 0,
                teamB: 0,
            },

            matchStarted: true,

            matchEnded: false,

            createdAt: Date.now(),
        };

        await GameStateService.saveGameState(
            roomCode,
            gameState
        );

        return gameState;
    }
}