import { Server, Socket } from "socket.io";

import { RoomService } from "../room-system/room.service";

export function registerRoomSockets(
  io: Server,
  socket: Socket
) {
  socket.on(
    "join_room",
    async ({ roomCode, player }) => {
      try {
        const room =
          await RoomService.joinRoom(
            roomCode,
            {
              ...player,
              socketId: socket.id,
            }
          );

        socket.join(roomCode);

        console.log(
          socket.id,
          "joined room",
          roomCode
        );

        io.to(roomCode).emit(
          "room_updated",
          room
        );

        console.log(
          `✅ ${player.username} joined ${roomCode}`
        );
      } catch (error: any) {
        socket.emit("room_error", {
          message: error.message,
        });
      }
    }
  );
}