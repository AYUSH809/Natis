import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    JWT_SECRET: z.string(),
    PORT: z.string().optional(),
});

export const env = envSchema.parse(process.env);