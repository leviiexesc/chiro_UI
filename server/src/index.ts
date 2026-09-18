import { app } from "./app.js";
import { config } from "./config/index.js";
import { prisma } from "./prisma.js";

const server = app.listen(config.PORT, () => {
  console.log(`
  🛡️ ========================================================
  ⚡ CHIRO UI LICENSE CENTER
  🌐 Environment: ${config.NODE_ENV}
  🚀 Server running on port ${config.PORT}
  🔗 API URL: http://localhost:${config.PORT}/api/v1
  📊 Health Check: http://localhost:${config.PORT}/api/v1/health
  ========================================================
  `);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("🔌 Database connections closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error disconnecting database:", err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    console.error("⚠️ Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
