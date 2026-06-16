import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "node:http";

import { prisma } from "./database/prisma";
import { redis } from "./redis/redis.client";

import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";
import gameRoutes from "./game-engine/game.routes";

import { initializeSocket } from "./socket/socket.server";

dotenv.config();

const app = express();

const server = http.createServer(app);

initializeSocket(server);

app.use(cors());

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/rooms", roomRoutes);

app.use("/game", gameRoutes);

app.get("/", async (_, res) => {
  try {
    const redisStatus = await redis.ping();

    await prisma.$queryRaw`SELECT 1`;

    res.json({
      message: "Natis Backend Running",
      redis: redisStatus,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Service error",
    });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("✅ Connected to Supabase");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

startServer();