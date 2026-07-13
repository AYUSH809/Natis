import { GameStateService } from "../redis/game-state.service";
import { RoomService } from "../room-system/room.service";
import { RoomPlayer } from "../types/room.types";
import { io } from "../socket/socket.server";

import {
    GameState,
    PlayerHand,
} from "./types/game.types";

import { DealService } from "./services/deal.service";
import { DeckService } from "./services/deck.service";
import { GamePayloadService } from "./services/game-payload.service";
import { ShuffleService } from "./services/shuffle.service";
import { MAX_PLAYERS } from "./utils/game-rules";

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

        if (room.matchStarted) {
            throw new Error(
                "Match already started"
            );
        }

        console.log("ROOM =", room);

        console.log("room.maxPlayers =", room.maxPlayers);
        console.log("typeof room.maxPlayers =", typeof room.maxPlayers);

        console.log("MAX_PLAYERS =", MAX_PLAYERS);
        console.log("typeof MAX_PLAYERS =", typeof MAX_PLAYERS);

        if (
            room.maxPlayers !==
            MAX_PLAYERS
        ) {
            throw new Error(
                "Only 4 player rooms are supported"
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

        let deck =
            DeckService.generateDeck(
                room.maxPlayers
            );

        deck =
            ShuffleService.shuffle(
                deck
            );

        const players: PlayerHand[] =
            room.players.map(
                (player: RoomPlayer) => ({
                    userId: player.userId,
                    username: player.username,
                    socketId: player.socketId,
                    team: player.team, cards: [],
                    roundsWon: 0,
                    disabled: false,
                    disconnected: false,
                })
            );

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
                dealResult.remainingDeck,
            currentDealerIndex: 0,
            currentBidderIndex: 0,
            trickRevealed: false,
            currentRound: 1,
            rounds: [],
            tableCards: [],
            score: {
                teamA: 0,
                teamB: 0,
            },
            matchStarted: true,
            matchEnded: false,
            createdAt: Date.now(),
            phase: "BIDDING",
            currentBid: undefined,
            highestBid: undefined,
            highestBidderId:
                undefined,
            winningBidderId:
                undefined,
            winningBid: undefined,
            trumpSuit: undefined,
            passedPlayers: [],
            currentBidderId:
                room.players[0].userId,
            currentPlayerTurn:
                undefined,
            selectedSuit:
                undefined,
            teamATricks: 0,
            teamBTricks: 0,
            biddingTeam: undefined,
            allHand: false,
            disabledPlayerIds: [],
            bidHistory: [],
        };

        room.matchStarted = true;

        await RoomService.saveRoom(
            room
        );

        await GameStateService.saveGameState(
            roomCode,
            gameState
        );

        for (const player of gameState.players) {
            if (!player.socketId) {
                continue;
            }

            io.to(player.socketId).emit(
                "match_started",
                GamePayloadService.buildPlayerState(
                    gameState,
                    player.userId,
                ),
            );
        }

        console.log("STEP 6: All emits completed");

        io.to(roomCode).emit(
            "room_updated",
            room
        );

        console.log("STEP 7: Returning");

        return gameState;
    }
}
