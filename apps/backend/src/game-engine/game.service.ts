import { RoomService } from "../room-system/room.service";

import { GameStateService } from "../redis/game-state.service";

import {
    GameState,
    PlayerHand,
} from "./types/game.types";

import { RoomPlayer } from "../types/room.types";

import { DeckService } from "./services/deck.service";

import { ShuffleService } from "./services/shuffle.service";

import { DealService } from "./services/deal.service";

import { io } from "../socket/socket.server";

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
            DeckService.generateDeck(
                room.maxPlayers
            );

        // SHUFFLE
        deck =
            ShuffleService.shuffle(
                deck
            );

        // CREATE PLAYER HANDS
        const players: PlayerHand[] =
            room.players.map((player: RoomPlayer) => ({
                userId: player.userId,

                username: player.username,

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
                dealResult.players,

            deck:
                dealResult.remainingDeck as any,

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

            phase: "BIDDING",

            currentBid: 0,

            highestBid: 0,

            highestBidderId: undefined,

            passedPlayers: [],

            currentBidderId:
                room.players[0].userId,

            bidHistory: [],
        };

        await GameStateService.saveGameState(
            roomCode,
            gameState
        );

        console.log(
            "ROOM PLAYERS:",
            room.players
        );

        for (const player of room.players) {
            console.log(
                "EMITTING TO:",
                player.username,
                player.socketId
            );

            if (!player.socketId) continue;

            io.to(player.socketId).emit(
                "match_started",
                {
                    roomCode,

                    playerId:
                        player.userId,

                    myHand:
                        gameState.players.find(
                            (p) => p.userId === player.userId
                        )?.cards ?? [],

                    players:
                        room.players.map(
                            (p: RoomPlayer) => ({
                                userId:
                                    p.userId,
                                username:
                                    p.username,
                                team:
                                    p.team,
                            })
                        ),

                    maxPlayers:
                        room.maxPlayers,

                    phase:
                        "BIDDING",

                    highestBid: 0,

                    highestBidderId: null,

                    currentBidderId:
                        room.players[0].userId,

                    bidHistory: [],
                }
            );
        }

        return gameState;
    }
}