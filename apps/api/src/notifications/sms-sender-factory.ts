import { NoopSmsSender } from "./noop-sms-sender.js";
import type { SmsSender } from "./sms-sender.js";
import { TermiiSmsSender } from "./termii-sms-sender.js";

/** Builds the SMS sender from environment variables. */
export class SmsSenderFactory {
  static create(): SmsSender {
    if (process.env.NODE_ENV === "test") {
      return new NoopSmsSender();
    }

    const provider = process.env.SMS_PROVIDER?.toLowerCase() ?? (process.env.TERMII_API_KEY ? "termii" : "noop");

    if (provider === "termii") {
      const apiKey = process.env.TERMII_API_KEY;
      const senderId = process.env.TERMII_SENDER_ID;

      if (!apiKey || !senderId) {
        throw new Error("TERMII_API_KEY and TERMII_SENDER_ID are required when SMS_PROVIDER=termii.");
      }

      return new TermiiSmsSender({
        apiKey,
        senderId,
        channel: process.env.TERMII_CHANNEL,
        endpoint: process.env.TERMII_SMS_ENDPOINT,
      });
    }

    if (provider === "noop" && process.env.NODE_ENV !== "production") {
      return new NoopSmsSender();
    }

    throw new Error("SMS delivery is not configured. Set SMS_PROVIDER=termii with TERMII_API_KEY and TERMII_SENDER_ID.");
  }
}
