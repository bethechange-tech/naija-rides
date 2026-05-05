import { db } from "@repo/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_USER_ID, createNaijaRidesServiceForUser, resetNaijaRidesData } from "../../data/index.js";
import { rideEventBus } from "../publisher/bus.js";
import { RideEventLogSubscriber } from "./ride-event-log-subscriber.js";
import { RideStateSubscriber } from "./ride-state-subscriber.js";

// Wire both subscribers onto the shared bus for each test run.
const logSubscriber = new RideEventLogSubscriber(rideEventBus);
const stateSubscriber = new RideStateSubscriber(rideEventBus);
logSubscriber.register();
stateSubscriber.register();

const flushAsyncListeners = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeService = (userId = CURRENT_USER_ID) =>
  createNaijaRidesServiceForUser(userId);

beforeEach(async () => {
  await resetNaijaRidesData();
});

// ---------------------------------------------------------------------------
// RideEventLogSubscriber
// ---------------------------------------------------------------------------

const findLog = (spy: ReturnType<typeof vi.spyOn>, eventName: string) =>
  spy.mock.calls
    .map((args: unknown[]) => {
      try { return JSON.parse(args[0] as string); } catch { return null; }
    })
    .find((c: Record<string, unknown> | null) => c?.event === eventName);

describe("RideEventLogSubscriber (BDD)", () => {
  describe("Given a ride exists and an event is published", () => {
    it("When ride.joined fires, Then logs include route, actor name, and event name", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const service = makeService();
      await service.joinRide("ride_004"); // ride_004 has a free seat

      // Log subscriber does real DB I/O asynchronously — poll until it appears.
      await vi.waitFor(() => {
        const joinLog = findLog(consoleSpy, "ride.joined");
        expect(joinLog).toBeDefined();
        expect(joinLog.rideId).toBe("ride_004");
        expect(joinLog.route).toMatch(/→/);
        expect(joinLog.actorName).toBeTruthy();
        expect(joinLog.level).toBe("info");
      }, { timeout: 5000 });

      consoleSpy.mockRestore();
    });

    it("When ride.created fires, Then logs include seatsTotal from metadata", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const service = makeService();
      await service.createRide({
        from: "Ikeja",
        to: "VI",
        time: "8:00 AM",
        seats: 3,
        price: 2000,
        repeatDays: ["Mon", "Wed"],
      });

      await vi.waitFor(() => {
        const createLog = findLog(consoleSpy, "ride.created");
        expect(createLog).toBeDefined();
        expect(createLog.seatsTotal).toBe(3);
        expect(createLog.message).toBe("Ride created");
      }, { timeout: 5000 });

      consoleSpy.mockRestore();
    });

    it("When booking.cancelled fires, Then log includes actor phone", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const service = makeService();
      await service.cancelBooking("booking_001");

      await vi.waitFor(() => {
        const cancelLog = findLog(consoleSpy, "booking.cancelled");
        expect(cancelLog).toBeDefined();
        expect(cancelLog.actorPhone).toBeTruthy();
      }, { timeout: 5000 });

      consoleSpy.mockRestore();
    });
  });
});

// ---------------------------------------------------------------------------
// RideStateSubscriber
// ---------------------------------------------------------------------------

describe("RideStateSubscriber (BDD)", () => {
  describe("Given a ride with one active booking (booking_001 on ride_001)", () => {
    it("When the last active booking is cancelled, Then ride auto-completes to 'completed'", async () => {
      // ride_001 has two bookings: booking_001 (current user) and booking_003 (rider_b).
      // Cancel rider_b's booking first as another user.
      const riderBService = createNaijaRidesServiceForUser("rider_b");
      await riderBService.cancelBooking("booking_003");

      // ride_001 should still be active (booking_001 still exists).
      const afterFirst = await db.ride.findUnique({ where: { id: "ride_001" }, select: { status: true } });
      expect(afterFirst?.status).toBe("active");

      // Now cancel the last booking.
      const service = makeService();
      await service.cancelBooking("booking_001");

      // Subscriber does async DB work — poll until ride status flips.
      await vi.waitFor(async () => {
        const ride = await db.ride.findUnique({ where: { id: "ride_001" }, select: { status: true } });
        expect(ride?.status).toBe("completed");
      }, { timeout: 5000 });
    });

    it("When a booking is cancelled but others remain, Then ride stays active", async () => {
      // ride_001 still has booking_003 (rider_b), cancel only booking_001.
      const service = makeService();
      await service.cancelBooking("booking_001");
      await flushAsyncListeners();

      const ride = await db.ride.findUnique({ where: { id: "ride_001" }, select: { status: true } });
      expect(ride?.status).toBe("active");
    });
  });

  describe("Given a ride with future ride responses", () => {
    it("When ride.cancelled fires, Then future ride responses are deleted", async () => {
      // Seed a ride response dated today (counted as future).
      const today = new Date().toISOString().slice(0, 10);
      await db.rideResponse.upsert({
        where: { userId_rideId_date: { userId: CURRENT_USER_ID, rideId: "ride_001", date: today } },
        update: { riding: true },
        create: { userId: CURRENT_USER_ID, rideId: "ride_001", date: today, riding: true },
      });

      const service = makeService("driver_tunde");
      await service.cancelRide("ride_001");
      await flushAsyncListeners();

      const remaining = await db.rideResponse.count({
        where: { rideId: "ride_001", date: { gte: today } },
      });
      expect(remaining).toBe(0);
    });

    it("When ride is cancelled, Then the ride status in DB is 'cancelled'", async () => {
      const service = makeService("driver_tunde");
      await service.cancelRide("ride_001");
      await flushAsyncListeners();

      const ride = await db.ride.findUnique({ where: { id: "ride_001" }, select: { status: true } });
      expect(ride?.status).toBe("cancelled");
    });
  });

  describe("Given a non-active ride receives a booking.cancelled event", () => {
    it("When ride is already cancelled, Then status is not changed to completed", async () => {
      // Cancel the ride first.
      const driverService = makeService("driver_tunde");
      await driverService.cancelRide("ride_001");
      await flushAsyncListeners();

      // Now cancel a booking on that ride — should not flip to completed.
      const service = makeService();
      await service.cancelBooking("booking_001");
      await flushAsyncListeners();

      const ride = await db.ride.findUnique({ where: { id: "ride_001" }, select: { status: true } });
      expect(ride?.status).toBe("cancelled");
    });
  });
});
