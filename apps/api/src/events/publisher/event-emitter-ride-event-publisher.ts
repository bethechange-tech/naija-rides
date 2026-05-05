import type { RideDomainEvent, RideEventPublisher } from "./types.js";
import type { RideEventBus } from "./bus.js";

export class EventEmitterRideEventPublisher implements RideEventPublisher {
  constructor(private readonly bus: RideEventBus) {}

  async publish(event: RideDomainEvent) {
    this.bus.emit("ride.event", event);
  }
}
