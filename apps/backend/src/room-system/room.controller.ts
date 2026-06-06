import { Request, Response } from "express";

import { RoomService } from "./room.service";

export class RoomController {
    static async createRoom(
        req: Request,
        res: Response
    ) {
        try {
            const { hostId, maxPlayers } =
                req.body;

            const room =
                await RoomService.createRoom(
                    hostId,
                    maxPlayers
                );

            return res.json(room);
        } catch (error: any) {
            console.error(
                "CREATE ROOM ERROR:",
                error
            );

            return res.status(500).json({
                message: "Failed to create room",
                error: error.message,
            });
        }
    }

    static async getRoom(
        req: Request,
        res: Response
    ) {
        try {
            const room =
                await RoomService.getRoom(
                    req.params.roomCode
                );

            return res.json(room);
        } catch (error: any) {
            console.error(
                "GET ROOM ERROR:",
                error
            );

            return res.status(500).json({
                message: "Failed to fetch room",
                error: error.message,
            });
        }
    }
}