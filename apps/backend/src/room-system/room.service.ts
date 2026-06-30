import { v4 as uuidv4 } from "uuid";

import { RoomState } from "../types/room.types";

import { RoomStateService } from "../redis/room-state.service";

export class RoomService {
    static async createRoom(
        hostId: string,
        maxPlayers: number
    ) {
        const roomCode = uuidv4()
            .slice(0, 6)
            .toUpperCase();

        const room: RoomState = {
            roomCode,
            hostId,
            maxPlayers,

            players: [
                {
                    userId: hostId,
                    username: "Host Player",
                    socketId: "",
                    team: "A",
                },
            ],

            createdAt: Date.now(),

            matchStarted: false,
        };

        await RoomStateService.saveRoomState(
            roomCode,
            room
        );

        return room;
    }

    static async getRoom(
        roomCode: string
    ) {
        return await RoomStateService.getRoomState(
            roomCode
        );
    }

    static async joinRoom(
        roomCode: string,
        player: any
    ) {
        const room =
            await RoomStateService.getRoomState(
                roomCode
            );

        if (!room) {
            throw new Error(
                "Room not found"
            );
        }

        const existingPlayer =
            room.players.find(
                (p: any) =>
                    p.userId ===
                    player.userId
            );

        // EXISTING PLAYER
        if (existingPlayer) {
            existingPlayer.socketId =
                player.socketId;

            await RoomStateService.saveRoomState(
                roomCode,
                room
            );

            return room;
        }

        // NEW PLAYER
        if (
            room.players.length >=
            room.maxPlayers
        ) {
            throw new Error(
                "Room full"
            );
        }

        const team =
            room.players.length % 2 === 0
                ? "A"
                : "B";

        room.players.push({
            ...player,
            team,
        });

        await RoomStateService.saveRoomState(
            roomCode,
            room
        );

        return room;
    }

    static async saveRoom(
        room: RoomState
    ) {
        await RoomStateService.saveRoomState(
            room.roomCode,
            room
        );

        return room;
    }
}