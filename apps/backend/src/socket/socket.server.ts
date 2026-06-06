import { Server } from "socket.io";

import { registerRoomSockets } from "./room.socket";

export let io: Server;

export function initializeSocket(server: any) {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
        console.log(
            `🔌 Player Connected: ${socket.id}`
        );

        registerRoomSockets(io, socket);

        socket.on("disconnect", () => {
            console.log(
                `❌ Player Disconnected: ${socket.id}`
            );
        });
    });

    return io;
}