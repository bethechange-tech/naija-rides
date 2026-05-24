import type { SmsMessage, SmsSender } from "./sms-sender.js";

/** Test/development sender that intentionally skips network delivery. */
export class NoopSmsSender implements SmsSender {
  async send(_message: SmsMessage) {
    return;
  }
}
