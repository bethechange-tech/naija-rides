import { db } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, createNaijaRidesServiceForUser, resetNaijaRidesData } from "./index.js";

const makeService = () => {
  return createNaijaRidesServiceForUser(CURRENT_USER_ID);
};

beforeEach(async () => {
  await resetNaijaRidesData();
});

describe("NaijaRidesService (BDD)", () => {
  describe("Given active rides on a route", () => {
    it("When searching with mixed case, Then returns matching active rides only", async () => {
      const service = makeService();

      const result = await service.searchActiveRides("yAbA", "vI");

      expect(result.length).toBe(1);
      expect(result.every((ride) => ride.status === "active")).toBe(true);
    });

    it("When one booking is cancelled, Then seatsTaken excludes cancelled bookings", async () => {
      const service = makeService();

      const cancelResult = await service.cancelBooking("booking_001");
      expect(cancelResult.ok).toBe(true);

      const result = await service.searchActiveRides("Yaba", "VI");
      const rideActive = result.find((ride) => ride.id === "ride_001");

      expect(rideActive?.seatsTaken).toBe(1);
    });
  });

  describe("Given the current user already has a booking", () => {
    it("When joining the same ride, Then returns a duplicate conflict", async () => {
      const service = makeService();

      const result = await service.joinRide("ride_001");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(409);
        expect(result.error).toBe("You already joined this ride");
      }
    });
  });

  describe("Given a ride is full", () => {
    it("When joining that ride, Then returns a full conflict", async () => {
      const service = makeService();

      const result = await service.joinRide("ride_002");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(409);
        expect(result.error).toBe("Ride is full");
      }
    });
  });

  describe("Given valid ride creation data", () => {
    it("When creating a ride, Then it persists as an active ride for the current user", async () => {
      const service = makeService();

      const created = await service.createRide({
        from: "  Ikeja ",
        to: " VI ",
        time: "9:15 AM",
        seats: 4,
        price: 1800,
        repeatDays: ["Mon", "Wed"],
      });

      expect(created.from).toBe("Ikeja");
      expect(created.to).toBe("VI");
      expect(created.status).toBe("active");
      expect(created.seatsTotal).toBe(4);
    });
  });

  describe("Given the current user is the driver", () => {
    it("When cancelling a ride, Then ride and all attached bookings are cancelled", async () => {
      const service = makeService();

      const created = await service.createRide({
        from: "Lekki",
        to: "Yaba",
        time: "6:00 PM",
        seats: 3,
        price: 3000,
        repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      });

      await db.rideBooking.create({ data: { id: "booking_cancel_1", rideId: created.id, riderUserId: "rider_b" } });
      await db.rideBooking.create({ data: { id: "booking_cancel_2", rideId: created.id, riderUserId: CURRENT_USER_ID } });

      const result = await service.cancelRide(created.id);

      expect(result.ok).toBe(true);
      const cancelledRide = await db.ride.findUnique({ where: { id: created.id } });
      const bookings = await db.rideBooking.findMany({ where: { rideId: created.id }, orderBy: { id: "asc" } });

      expect(cancelledRide?.status).toBe("cancelled");
      expect(bookings.every((booking) => booking.cancelledAt)).toBe(true);
    });
  });

  describe("Given a booking belongs to another rider", () => {
    it("When current user cancels it, Then returns a forbidden error", async () => {
      const service = makeService();

      const result = await service.cancelBooking("booking_003");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(403);
        expect(result.error).toBe("You can only cancel your own bookings");
      }
    });
  });

  describe("Given the current user cancels their own booking", () => {
    it("When retrieving rider bookings, Then the cancelled booking is excluded", async () => {
      const service = makeService();

      const cancelResult = await service.cancelBooking("booking_001");
      expect(cancelResult.ok).toBe(true);

      const riderBookings = await service.getRiderBookingsForCurrentUser();

      expect(riderBookings.some((booking) => booking.id === "booking_001")).toBe(false);
    });
  });
});
