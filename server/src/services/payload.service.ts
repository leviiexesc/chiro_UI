import fs from "fs";
import path from "path";
import crypto from "crypto";

const MASTER_SECRET = process.env.PAYLOAD_SECRET || "ChiroMasterPayloadKey2026!Secured";

export class PayloadService {
  private static cachedScript: string | null = null;
  private static cachedLoader: string | null = null;

  /**
   * Initializes and caches the script payload in memory
   */
  public static initialize(): void {
    try {
      this.cachedScript = this.loadScriptFromStorage();
      if (this.cachedScript) {
        console.log(`🛡️ [PayloadService] Protected script payload loaded (${this.cachedScript.length} chars).`);
      } else {
        console.warn("⚠️ [PayloadService] Script payload not found or could not be decrypted.");
      }
    } catch (err: any) {
      console.error("❌ [PayloadService] Initialization error:", err.message);
    }
  }

  /**
   * Loads script from encrypted storage, or falls back to local unencrypted file
   */
  private static loadScriptFromStorage(): string {
    const encCandidates = [
      path.resolve(process.cwd(), "server/storage/payload.enc"),
      path.resolve(__dirname, "../../storage/payload.enc"),
      path.resolve(__dirname, "../../../server/storage/payload.enc"),
    ];

    for (const p of encCandidates) {
      if (fs.existsSync(p)) {
        try {
          const encBuffer = fs.readFileSync(p);
          const key = crypto.createHash("sha256").update(MASTER_SECRET).digest();
          const iv = encBuffer.subarray(0, 16);
          const ciphertext = encBuffer.subarray(16);
          const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
          const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
          return decrypted.toString("utf8");
        } catch (decryptErr: any) {
          console.error(`❌ [PayloadService] Failed to decrypt ${p}:`, decryptErr.message);
        }
      }
    }

    // Fallback: check plain file if enc not available
    const plainCandidates = [
      path.resolve(process.cwd(), "chiro_lib.luau"),
      path.resolve(__dirname, "../../chiro_lib.luau"),
      path.resolve(__dirname, "../../../chiro_lib.luau"),
    ];

    for (const p of plainCandidates) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, "utf8");
        if (text && !text.includes("[CHIRO UI SECURITY ENFORCEMENT]")) {
          return text;
        }
      }
    }

    return "";
  }

  /**
   * Returns the raw decrypted script
   */
  public static getRawScript(): string {
    if (!this.cachedScript) {
      this.cachedScript = this.loadScriptFromStorage();
    }
    return this.cachedScript || "";
  }

  /**
   * XOR-encrypts the script using the client's verified license key
   * Returns Base64-encoded ciphertext
   */
  public static getEncryptedPayload(clientKey: string): string {
    const script = this.getRawScript();
    if (!script) return "";

    const textBuf = Buffer.from(script, "utf8");
    const keyBuf = Buffer.from(clientKey.trim(), "utf8");
    const outBuf = Buffer.alloc(textBuf.length);

    for (let i = 0; i < textBuf.length; i++) {
      outBuf[i] = textBuf[i] ^ keyBuf[i % keyBuf.length];
    }

    return outBuf.toString("base64");
  }

  /**
   * Gets the public lightweight loader script content
   */
  public static getLoaderScript(): string {
    const candidates = [
      path.resolve(process.cwd(), "chiro_loader.lua"),
      path.resolve(__dirname, "../../chiro_loader.lua"),
      path.resolve(__dirname, "../../../chiro_loader.lua"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf8");
      }
    }

    return "";
  }
}
