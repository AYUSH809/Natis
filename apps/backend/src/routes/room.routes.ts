import { Router } from "express";

import { RoomController } from "../room-system/room.controller";

const router = Router();

router.get("/test", (_, res) => {
    res.json({
        success: true,
        message: "Room routes working",
    });
});

router.post("/create", RoomController.createRoom);

router.get("/:roomCode", RoomController.getRoom);

export default router;