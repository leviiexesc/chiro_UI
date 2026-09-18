import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { config } from "../config/index.js";
import { prisma } from "../prisma.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      throw new UnauthorizedError("Authentication token is required", "UNAUTHORIZED");
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      username: string;
      role: Role;
    };

    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.sub },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!admin) {
      throw new UnauthorizedError("Admin account no longer exists", "UNAUTHORIZED");
    }

    req.admin = admin;
    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Invalid or expired session token", "UNAUTHORIZED"));
    }
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new UnauthorizedError("Unauthorized access", "UNAUTHORIZED"));
    }

    if (!roles.includes(req.admin.role)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of: ${roles.join(", ")}`,
          "FORBIDDEN_ROLE"
        )
      );
    }

    next();
  };
}
