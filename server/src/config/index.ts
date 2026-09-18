import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(10000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  ADMIN_SESSION_SECRET: z.string().min(16, "ADMIN_SESSION_SECRET must be at least 16 characters"),
  CORS_ORIGIN: z.string().default("*"),
  INITIAL_ADMIN_USERNAME: z.string().default("admin"),
  INITIAL_ADMIN_EMAIL: z.string().email().default("admin@chiro.local"),
  INITIAL_ADMIN_PASSWORD: z.string().optional().default("ChiroAdmin2026!"),
  CLIENT_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  CLIENT_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid configuration");
}

export const config = parsedEnv.data;
