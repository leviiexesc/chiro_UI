import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { sendSuccess, sendError } from "./utils/response.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import licenseRoutes from "./routes/license.routes.js";
import productRoutes from "./routes/product.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import clientRoutes from "./routes/client.routes.js";
import blacklistRouter from "./routes/blacklist.routes.js";

// __dirname is available in CommonJS (NodeNext resolves to CJS)

export const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite inline styles/scripts in SPA
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
const corsOrigins = config.CORS_ORIGIN === "*" ? "*" : config.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body Parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Health Check Endpoint (Render & Monitoring)
app.get("/api/v1/health", (req, res) => {
  return sendSuccess(res, {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "Chiro UI License Center",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/licenses", licenseRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/devices", deviceRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/admin/blacklist", blacklistRouter);

// Production Static Serving for Frontend Dashboard
const clientBuildPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // SPA fallback for HTML5 History API
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  return sendError(res, "ROUTE_NOT_FOUND", `The requested route ${req.originalUrl} does not exist.`, 404);
});

// Centralized Error Handler
app.use(errorHandler);
