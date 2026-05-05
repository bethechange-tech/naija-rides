import { RideEventSubscriberRegistry } from "./subscriber-registry.js";
import { RideEventLogSubscriber } from "./ride-event-log-subscriber.js";
import { RideStateSubscriber } from "./ride-state-subscriber.js";
import { rideEventBus } from "../publisher/bus.js";

export * from "./ride-event-subscriber.js";
export * from "./subscriber-registry.js";
export * from "./ride-event-log-subscriber.js";
export * from "./ride-state-subscriber.js";

const subscriberRegistry = new RideEventSubscriberRegistry([
  new RideEventLogSubscriber(rideEventBus),
  new RideStateSubscriber(rideEventBus),
]);

export const registerRideEventSubscribers = () => {
  subscriberRegistry.registerAll();
};
