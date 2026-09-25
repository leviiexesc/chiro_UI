import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // 1. AppError (our typed business errors)
  if (err instanceof AppError || err?.name === "AppError" || (typeof err?.statusCode === "number" && err?.code)) {
    return sendError(res, err.code, err.message, err.statusCode, err.details);
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed";
    return sendError(res, "VALIDATION_ERROR", message, 400, err.format());
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
      return sendError(
        res,
        "CONFLICT",
        `A record with this ${target.join(", ") || "identifier"} already exists.`,
        409
      );
    }
    if (err.code === "P2025") {
      return sendError(res, "NOT_FOUND", "Requested resource was not found.", 404);
    }
  }

  // 4. Default Internal Server Error
  console.error("💥 Unhandled Error:", err);
  const isProd = process.env.NODE_ENV === "production";
  return sendError(
    res,
    "INTERNAL_SERVER_ERROR",
    isProd ? "An unexpected server error occurred." : err.message || "Internal server error",
    500
  );
}
