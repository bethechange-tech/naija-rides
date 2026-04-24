import type { RideDomainEvent } from "../publisher/types.js";
import type { RideEventBus } from "../publisher/bus.js";

export abstract class RideEventSubscriber {
  constructor(protected readonly bus: RideEventBus) {}

  register() {
    this.bus.on("ride.event", (event) => {
      // Listener runs detached from request lifecycle.
      void this.handle(event);
    });
  }

  protected abstract handle(event: RideDomainEvent): Promise<void>;
}
