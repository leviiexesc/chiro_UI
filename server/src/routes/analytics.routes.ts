import { Router } from "express";
import { prisma } from "../prisma.js";
import { sendSuccess } from "../utils/response.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateAdmin);

// GET /api/v1/admin/analytics
// Returns live player analytics: count, game breakdown, executor breakdown, session log
router.get("/", async (req, res, next) => {
  try {
    // Mark sessions inactive if lastPingAt older than 12 minutes (stale = player left)
    const staleCutoff = new Date(Date.now() - 12 * 60 * 1000);
    await prisma.scriptSession.updateMany({
      where: { isActive: true, lastPingAt: { lt: staleCutoff } },
      data: { isActive: false },
    });

    // Fetch all active sessions
    const activeSessions = await prisma.scriptSession.findMany({
      where: { isActive: true },
      orderBy: { lastPingAt: "desc" },
    });

    const liveCount = activeSessions.length;

    // Game breakdown: group by gameName
    const gameMap = new Map<string, number>();
    for (const s of activeSessions) {
      const name = s.gameName || "Unknown";
      gameMap.set(name, (gameMap.get(name) || 0) + 1);
    }
    const gameBreakdown = Array.from(gameMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Executor breakdown: group by executor
    const execMap = new Map<string, number>();
    for (const s of activeSessions) {
      const exec = s.executor || "Unknown";
      execMap.set(exec, (execMap.get(exec) || 0) + 1);
    }
    const executorBreakdown = Array.from(execMap.entries())
      .map(([executor, count]) => ({ executor, count }))
      .sort((a, b) => b.count - a.count);

    // Session log: compute duration from startedAt to now
    const sessionLog = activeSessions.map((s) => ({
      id: s.id,
      robloxUser: s.robloxUser || "—",
      gameName: s.gameName || "Unknown",
      executor: s.executor || "Unknown",
      country: s.country || "—",
      ipAddress: s.ipAddress || "—",
      placeId: s.placeId || "—",
      durationSeconds: Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000),
      lastPingAt: s.lastPingAt.toISOString(),
      startedAt: s.startedAt.toISOString(),
    }));

    return sendSuccess(res, {
      liveCount,
      gameBreakdown,
      executorBreakdown,
      sessionLog,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
