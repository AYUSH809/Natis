import { redis } from "./redis.client";

export class RoomStateService {
    static async saveRoomState(roomId: string, state: any) {
        await redis.set(
            `room:${roomId}`,
            JSON.stringify(state)
        );
    }

    static async getRoomState(roomId: string) {
        const data = await redis.get(`room:${roomId}`);

        return data ? JSON.parse(data) : null;
    }

    static async deleteRoom(roomId: string) {
        await redis.del(`room:${roomId}`);
    }
}