import { redis } from "./redis.client";

export class TimerCacheService {
    static async saveTimer(
        roomId: string,
        timerData: any
    ) {
        await redis.set(
            `timer:${roomId}`,
            JSON.stringify(timerData)
        );
    }

    static async getTimer(roomId: string) {
        const data = await redis.get(`timer:${roomId}`);

        return data ? JSON.parse(data) : null;
    }
}