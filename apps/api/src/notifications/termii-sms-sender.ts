import type { SmsMessage, SmsSender } from "./sms-sender.js";

type TermiiSmsSenderOptions = {
  apiKey: string;
  senderId: string;
  channel?: string;
  endpoint?: string;
};

/** Sends SMS messages through Termii's messaging API. */
export class TermiiSmsSender implements SmsSender {
  private readonly endpoint: string;
  private readonly channel: string;

  constructor(private readonly options: TermiiSmsSenderOptions) {
    this.endpoint = options.endpoint ?? "https://api.ng.termii.com/api/sms/send";
    this.channel = options.channel ?? "dnd";
  }

  async send(message: SmsMessage) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.options.apiKey,
        to: this.normalizeRecipient(message.to),
        from: this.options.senderId,
        sms: message.body,
        type: "plain",
        channel: this.channel,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`Termii SMS delivery failed with ${response.status}: ${responseBody}`);
    }
  }

  private normalizeRecipient(phone: string) {
    return phone.trim().replace(/^\+/, "");
  }
}
