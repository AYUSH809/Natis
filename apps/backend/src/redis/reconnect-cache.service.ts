import { redis } from "./redis.client";

export class ReconnectCacheService {
    static async saveReconnectState(
        playerId: string,
        state: any
    ) {
        await redis.set(
            `reconnect:${playerId}`,
            JSON.stringify(state),
            "EX",
            300
        );
    }

    static async getReconnectState(playerId: string) {
        const data = await redis.get(
            `reconnect:${playerId}`
        );

        return data ? JSON.parse(data) : null;
    }
}