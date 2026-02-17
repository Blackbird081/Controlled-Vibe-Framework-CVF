// @reference-only — This module is not wired into the main execution pipeline.
// src/utils/encryption.ts

import crypto from "crypto";

const ALGORITHM = "aes-256-ctr";
const HMAC_ALGORITHM = "sha256";

export class EncryptionUtil {
  static encrypt(text: string, secret: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto
      .createHash("sha256")
      .update(secret)
      .digest();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted =
      cipher.update(text, "utf8", "hex") + cipher.final("hex");

    // HMAC for tamper detection
    const hmac = crypto
      .createHmac(HMAC_ALGORITHM, key)
      .update(iv.toString("hex") + ":" + encrypted)
      .digest("hex");

    return iv.toString("hex") + ":" + encrypted + ":" + hmac;
  }

  static decrypt(hash: string, secret: string): string {
    const parts = hash.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const [ivHex, encrypted, hmac] = parts;

    const key = crypto
      .createHash("sha256")
      .update(secret)
      .digest();

    // Verify HMAC before decryption
    const expectedHmac = crypto
      .createHmac(HMAC_ALGORITHM, key)
      .update(ivHex + ":" + encrypted)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(hmac, "hex"),
        Buffer.from(expectedHmac, "hex")
      )
    ) {
      throw new Error("Data integrity check failed — possible tampering");
    }

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    return (
      decipher.update(encrypted, "hex", "utf8") +
      decipher.final("utf8")
    );
  }
}
