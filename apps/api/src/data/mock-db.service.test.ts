import { describe, expect, it } from "vitest";
import { MapNaijaRidesRepository, NaijaRidesService } from "./mock-db.js";

const CURRENT_USER_ID = "user_me";

const makeService = () => {
  const repo = new MapNaijaRidesRepository();
  const service = new NaijaRidesService(repo, CURRENT_USER_ID);

  service.seed({
    users: [
      { id: CURRENT_USER_ID, phone: "+2348000000000", name: "Rasul" },
      { id: "driver_1", phone: "+2348000000001", name: "Driver One", company: "RideCo" },
      { id: "driver_2", phone: "+2348000000002", name: "Driver Two" },
      { id: "rider_x", phone: "+2348000000003", name: "Rider X" },
    ],
    rides: [
      {
        id: "ride_active",
        driverUserId: "driver_1",
        from: "Yaba",
        to: "Victoria Island",
        time: "7:30 AM",
        price: 2500,
        seatsTotal: 2,
        status: "active",
        repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
      {
        id: "ride_full",
        driverUserId: "driver_2",
        from: "Yaba",
        to: "Victoria Island",
        time: "8:00 AM",
        price: 2100,
        seatsTotal: 1,
        status: "active",
        repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
      {
        id: "ride_cancel_me",
        driverUserId: CURRENT_USER_ID,
        from: "Lekki",
        to: "Yaba",
        time: "6:00 PM",
        price: 3000,
        seatsTotal: 3,
        status: "active",
        repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
    ],
    rideBookings: [
      { id: "booking_current", rideId: "ride_active", riderUserId: CURRENT_USER_ID },
      { id: "booking_cancelled", rideId: "ride_active", riderUserId: "rider_x", cancelledAt: "2026-01-01T00:00:00.000Z" },
      { id: "booking_full", rideId: "ride_full", riderUserId: "rider_x" },
      { id: "booking_cancel_1", rideId: "ride_cancel_me", riderUserId: "rider_x" },
      { id: "booking_cancel_2", rideId: "ride_cancel_me", riderUserId: CURRENT_USER_ID },
    ],
    rideResponses: [],
  });

  return { repo, service };
};

describe("NaijaRidesService (BDD)", () => {
  describe("Given active rides on a route", () => {
    it("When searching with mixed case, Then returns matching active rides only", () => {
      const { service } = makeService();

      // alias match: "vI" matches "Victoria Island" alias "VI"
      const result = service.searchActiveRides("yAbA", "vI");

      expect(result.length).toBe(2);
      expect(result.every((ride) => ride.status === "active")).toBe(true);
    });

    it("When one booking is cancelled, Then seatsTaken excludes cancelled bookings", () => {
      const { service } = makeService();

      // alias match: "VI" matches "Victoria Island" alias "VI"
      const result = service.searchActiveRides("Yaba", "VI");
      const rideActive = result.find((ride) => ride.id === "ride_active");

      expect(rideActive).toBeDefined();
      expect(rideActive?.seatsTaken).toBe(1);
    });
  });

  describe("Given the current user already has a booking", () => {
    it("When joining the same ride, Then returns a duplicate conflict", () => {
      const { service } = makeService();

      const result = service.joinRide("ride_active");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(409);
        expect(result.error).toBe("You already joined this ride");
      }
    });
  });

  describe("Given a ride is full", () => {
    it("When joining that ride, Then returns a full conflict", () => {
      const { service } = makeService();

      const result = service.joinRide("ride_full");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(409);
        expect(result.error).toBe("Ride is full");
      }
    });
  });

  describe("Given valid ride creation data", () => {
    it("When creating a ride, Then it persists as an active ride for the current user", () => {
      const { service } = makeService();

      const created = service.createRide({
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
    it("When cancelling a ride, Then ride and all attached bookings are cancelled", () => {
      const { repo, service } = makeService();

      const result = service.cancelRide("ride_cancel_me");

      expect(result.ok).toBe(true);
      expect(repo.rides.get("ride_cancel_me")?.status).toBe("cancelled");
      expect(repo.rideBookings.get("booking_cancel_1")?.cancelledAt).toBeTruthy();
      expect(repo.rideBookings.get("booking_cancel_2")?.cancelledAt).toBeTruthy();
    });
  });

  describe("Given a booking belongs to another rider", () => {
    it("When current user cancels it, Then returns a forbidden error", () => {
      const { service } = makeService();

      const result = service.cancelBooking("booking_full");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(403);
        expect(result.error).toBe("You can only cancel your own bookings");
      }
    });
  });

  describe("Given the current user cancels their own booking", () => {
    it("When retrieving rider bookings, Then the cancelled booking is excluded", () => {
      const { service } = makeService();

      const cancelResult = service.cancelBooking("booking_current");
      expect(cancelResult.ok).toBe(true);

      const riderBookings = service.getRiderBookingsForCurrentUser();

      expect(riderBookings.some((booking) => booking.id === "booking_current")).toBe(false);
    });
  });
});
