import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  rideEventBus,
  rideEventPublisher,
  type RideDomainEvent,
} from "./publisher/index.js";
import { registerRideEventSubscribers } from "./consumer/index.js";

const event: RideDomainEvent = {
  eventName: "ride.joined",
  rideId: "ride_001",
  actorUserId: "user_me",
  occurredAt: new Date().toISOString(),
  metadata: { seatsTotal: 4 },
};

const flushAsyncListeners = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

beforeAll(() => {
  registerRideEventSubscribers();
});

describe("Ride event publisher", () => {
  it("publishes on the EventEmitter bus", async () => {
    const emitSpy = vi.spyOn(rideEventBus, "emit");

    await rideEventPublisher.publish(event);

    expect(emitSpy).toHaveBeenCalledWith("ride.event", event);
    emitSpy.mockRestore();
  });

  it("registers subscribers idempotently", () => {
    const onSpy = vi.spyOn(rideEventBus, "on");
    onSpy.mockClear();

    registerRideEventSubscribers();
    registerRideEventSubscribers();

    expect(onSpy).not.toHaveBeenCalled();
    onSpy.mockRestore();
  });

  it("publishes successfully without queue subscribers", async () => {
    const emitSpy = vi.spyOn(rideEventBus, "emit");

    await rideEventPublisher.publish(event);
    await flushAsyncListeners();

    expect(emitSpy).toHaveBeenCalledWith("ride.event", event);
    emitSpy.mockRestore();
  });
});
