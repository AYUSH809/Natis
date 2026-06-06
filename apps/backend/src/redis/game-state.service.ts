import redisClient from "./redis.client";

import { GameState } from "../game-engine/types/game.types";

export class GameStateService {
    static async saveGameState(
        roomCode: string,
        state: GameState
    ) {
        await redisClient.set(
            `game:${roomCode}`,
            JSON.stringify(state)
        );
    }

    static async getGameState(
        roomCode: string
    ): Promise<GameState | null> {
        const data =
            await redisClient.get(
                `game:${roomCode}`
            );

        if (!data) return null;

        return JSON.parse(data);
    }

    static async deleteGameState(
        roomCode: string
    ) {
        await redisClient.del(
            `game:${roomCode}`
        );
    }
}