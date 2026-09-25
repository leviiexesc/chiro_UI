import { LicenseService } from "./license.service.js";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

export class TelegramBotService {
  private static token: string | null = null;
  private static isRunning = false;
  private static lastUpdateId = 0;
  private static botUsername = "";

  public static initialize(token?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN || null;
    if (!this.token || this.token.trim() === "") {
      console.log("ℹ️  Telegram Bot: TELEGRAM_BOT_TOKEN not provided. Telegram bot is idle.");
      return;
    }

    this.startPolling();
  }

  private static async callApi(method: string, payload: Record<string, unknown> = {}) {
    if (!this.token) return null;
    try {
      const url = `https://api.telegram.org/bot${this.token}/${method}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;
      return data;
    } catch (err) {
      console.error(`❌ Telegram API Error (${method}):`, err);
      return null;
    }
  }

  public static async sendMessage(chatId: number | string, text: string, parseMode: "Markdown" | "HTML" = "Markdown") {
    return await this.callApi("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    });
  }

  private static async startPolling() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Verify bot token
    const me = await this.callApi("getMe");
    if (!me || !me.ok) {
      console.error("❌ Telegram Bot: Invalid bot token or unable to reach Telegram API.");
      this.isRunning = false;
      return;
    }

    this.botUsername = me.result?.username || "ChiroLicenseBot";
    console.log(`🤖 Telegram Bot Active: @${this.botUsername}`);

    // Polling loop
    while (this.isRunning) {
      try {
        const data = await this.callApi("getUpdates", {
          offset: this.lastUpdateId + 1,
          timeout: 25,
          allowed_updates: ["message"],
        });

        if (data && data.ok && Array.isArray(data.result)) {
          for (const update of data.result as TelegramUpdate[]) {
            this.lastUpdateId = update.update_id;
            if (update.message && update.message.text) {
              await this.handleMessage(update.message);
            }
          }
        }
      } catch (loopErr) {
        console.error("⚠️ Telegram polling error:", loopErr);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  public static stop() {
    this.isRunning = false;
  }

  private static async handleMessage(msg: NonNullable<TelegramUpdate["message"]>) {
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const from = msg.from;
    const username = from?.username ? `@${from.username}` : from?.first_name || "User";

    // 1. /start
    if (text === "/start") {
      const welcome = `⚡ *WELCOME TO CHIRO UI LICENSE CENTER* ⚡

Hello, *${username}*! This bot helps you redeem your purchase codes into high-security execution keys.

*Available Commands:*
🔑 \`/redeem <CODE>\` — Redeem your purchase voucher
🆓 \`/free\` — Get link for a Free 24-Hour Key
ℹ️ \`/help\` — How to use and support

*Example:*
\`/redeem CHIRO-RA3H-RUEY-ESKF\`

_You can also directly paste your purchase code here!_`;
      await this.sendMessage(chatId, welcome);
      return;
    }

    // 2. /help
    if (text === "/help") {
      const help = `📖 *CHIRO LICENSE BOT HELP*

1️⃣ *How do I buy a key?*
Purchase a license from our official store or community channel. You will receive a purchase code like \`CHIRO-XXXX-XXXX-XXXX\`.

2️⃣ *How do I redeem it?*
Send:
\`/redeem YOUR-CODE\`
The bot will verify the voucher and grant you a cryptographically secure script key (\`CHIRO_xxxxxxxx...\`).

3️⃣ *How do I run it in Roblox?*
Add this at the very top of your script executor:
\`\`\`lua
getgenv().Key = "CHIRO_YOUR_REDEEMED_KEY"
\`\`\`

4️⃣ *Need a Free Key?*
Type \`/free\` to access our free key generator checkpoint!`;
      await this.sendMessage(chatId, help);
      return;
    }

    // 3. /free
    if (text === "/free") {
      const freeMsg = `🆓 *CHIRO UI FREE 24-HOUR KEY*

You can generate a free 24-hour key by completing 3 quick checkpoints:

👉 *Checkpoint Generator:*
https://chiro-license-center.onrender.com/free-key

1. Open the page above
2. Complete the steps (15s wait each)
3. Receive your free license key instantly!`;
      await this.sendMessage(chatId, freeMsg);
      return;
    }

    // 4. /redeem <CODE> or direct voucher paste
    let codeToRedeem = "";
    if (text.startsWith("/redeem")) {
      codeToRedeem = text.replace("/redeem", "").trim();
    } else if (text.toUpperCase().startsWith("CHIRO-") && text.length >= 10) {
      // Direct paste of purchase code
      codeToRedeem = text.trim();
    }

    if (codeToRedeem) {
      await this.sendMessage(chatId, "⏳ *Verifying and redeeming your voucher...*");

      try {
        const result = await LicenseService.redeemVoucher(codeToRedeem, {
          telegramId: from?.id,
          telegramUsername: from?.username,
        });

        const durationStr = result.durationDays ? `${result.durationDays} Days` : "Lifetime VIP";
        const reply = `🎉 *PURCHASE VOUCHER REDEEMED!*

📦 *Product:* ${result.product.name}
⏳ *Duration:* ${durationStr}
📱 *Device Slots:* ${result.maxDevices}

🔑 *Your High-Security Script Key:*
\`${result.key}\`
_(Tap key above to copy)_

📋 *How to execute in your script:*
\`\`\`lua
getgenv().Key = "${result.key}"
local Chiro = loadstring(game:HttpGet("https://raw.githubusercontent.com/leviiexesc/chiro_UI/main/chiro_lib.luau"))()
\`\`\`

⚠️ *Important:* Save your key! Your original purchase code has been consumed.`;

        await this.sendMessage(chatId, reply);
      } catch (err: any) {
        const errMsg = err?.message || "Invalid or already redeemed voucher code.";
        await this.sendMessage(
          chatId,
          `❌ *Redeem Failed*\n\n${errMsg}\n\nPlease check your purchase code and try again or contact support.`
        );
      }
      return;
    }

    // Unrecognized message
    await this.sendMessage(
      chatId,
      `❓ Unrecognized command. Send \`/redeem <CODE>\` to redeem your purchase voucher, or \`/help\` for instructions.`
    );
  }
}
