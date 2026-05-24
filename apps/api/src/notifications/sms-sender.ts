export type SmsMessage = {
  to: string;
  body: string;
};

/** Sends SMS messages through a configured provider. */
export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}
