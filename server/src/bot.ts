import dotenv from "dotenv";
import { TelegramBotService } from "./services/telegramBot.service.js";

dotenv.config();

console.log("🚀 Starting Chiro UI Telegram Bot standalone runner...");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is not set in environment or .env file!");
  console.error("Get a bot token from @BotFather on Telegram and set TELEGRAM_BOT_TOKEN=your_token_here");
  process.exit(1);
}

TelegramBotService.initialize(token);

process.on("SIGINT", () => {
  console.log("\n🛑 Stopping Telegram Bot...");
  TelegramBotService.stop();
  process.exit(0);
});
