import type { RideEventSubscriber } from "./ride-event-subscriber.js";

export class RideEventSubscriberRegistry {
  private registered = false;

  constructor(private readonly subscribers: RideEventSubscriber[]) {}

  registerAll() {
    if (this.registered) {
      return;
    }

    this.registered = true;
    for (const subscriber of this.subscribers) {
      subscriber.register();
    }
  }
}
