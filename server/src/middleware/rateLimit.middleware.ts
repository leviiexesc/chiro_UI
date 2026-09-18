import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { sendError } from "../utils/response.js";

export const clientRateLimiter = rateLimit({
  windowMs: config.CLIENT_RATE_LIMIT_WINDOW_MS,
  max: config.CLIENT_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      "RATE_LIMIT_EXCEEDED",
      "Too many verification requests from this IP. Please try again in a few moments.",
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      "TOO_MANY_LOGIN_ATTEMPTS",
      "Too many failed login attempts. Please try again after 15 minutes.",
      429
    );
  },
});
