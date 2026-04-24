import { EventEmitter } from "node:events";
import type { RideDomainEvent } from "./types.js";

type RideEventMap = {
  "ride.event": RideDomainEvent;
};

export class RideEventBus extends EventEmitter {
  emit<K extends keyof RideEventMap>(eventName: K, payload: RideEventMap[K]): boolean {
    return super.emit(eventName, payload);
  }

  on<K extends keyof RideEventMap>(eventName: K, listener: (payload: RideEventMap[K]) => void): this {
    super.on(eventName, listener);
    return this;
  }
}

export const rideEventBus = new RideEventBus();
