import { Team } from "../game-engine/types/game.types";

export interface RoomPlayer {
    userId: string;
    username: string;
    socketId: string;
    team?: Team;
}

export interface RoomState {
    roomCode: string;
    hostId: string;
    maxPlayers: number;
    players: RoomPlayer[];
    createdAt: number;
    matchStarted: boolean;
}
