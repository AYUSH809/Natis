export interface RoomPlayer {
    userId: string;
    username: string;
    socketId: string;
    team?: string;
}

export interface RoomState {
    roomCode: string;
    hostId: string;
    maxPlayers: number;
    players: RoomPlayer[];
    createdAt: number;
    matchStarted: boolean;
}