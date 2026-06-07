import { redis } from "./redis.client";

export class GameStateService {
    static async saveGameState(
        roomCode: string,
        gameState: any
    ) {
        await redis.set(
            `game:${roomCode}`,
            JSON.stringify(gameState)
        );
    }

    static async getGameState(
        roomCode: string
    ) {
        const data = await redis.get(
            `game:${roomCode}`
        );

        if (!data) return null;

        return JSON.parse(data);
    }

    static async deleteGameState(
        roomCode: string
    ) {
        await redis.del(
            `game:${roomCode}`
        );
    }
}