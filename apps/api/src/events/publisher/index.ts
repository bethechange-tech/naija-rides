import { rideEventBus } from "./bus.js";
import type { RideEventPublisher } from "./types.js";
import { EventEmitterRideEventPublisher } from "./event-emitter-ride-event-publisher.js";

export * from "./types.js";
export * from "./bus.js";
export * from "./event-emitter-ride-event-publisher.js";

export const rideEventPublisher: RideEventPublisher = new EventEmitterRideEventPublisher(rideEventBus);
