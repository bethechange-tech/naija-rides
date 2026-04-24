import { db } from "@repo/db";
import { RideEventSubscriber } from "./ride-event-subscriber.js";
import type { RideDomainEvent } from "../publisher/types.js";

/**
 * Handles DB-level invariants triggered by ride domain events.
 *
 * Race condition safety: when a booking is cancelled, multiple events can
 * fire concurrently. Each handler acquires a row-level lock (SELECT FOR UPDATE)
 * on the ride inside a transaction before counting remaining active bookings,
 * so only one writer can transition the ride to "completed" at a time.
 */
export class RideStateSubscriber extends RideEventSubscriber {
  protected async handle(event: RideDomainEvent) {
    switch (event.eventName) {
      case "booking.cancelled":
        await this.onBookingCancelled(event.rideId);
        break;
      case "ride.cancelled":
        await this.onRideCancelled(event.rideId);
        break;
      default:
        break;
    }
  }

  /**
   * When a booking is cancelled, auto-complete the ride if it now has
   * zero active bookings. The FOR UPDATE lock serializes concurrent handlers.
   */
  private async onBookingCancelled(rideId: string) {
    await db.$transaction(async (tx) => {
      // Lock the ride row to prevent concurrent updates.
      const rows = await tx.$queryRaw<Array<{ status: string }>>`
        SELECT status FROM rides WHERE id = ${rideId} FOR UPDATE
      `;

      if (rows.length === 0) return;
      if (rows[0].status !== "active") return;

      const activeBookings = await tx.rideBooking.count({
        where: { rideId, cancelledAt: null },
      });

      if (activeBookings === 0) {
        await tx.ride.update({
          where: { id: rideId },
          data: { status: "completed" },
        });

        console.info(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "info",
            event: "ride.auto_completed",
            message: "Ride auto-completed after last booking cancelled",
            rideId,
          })
        );
      }
    });
  }

  /**
   * When a ride is cancelled, ensure all future-dated ride responses
   * (riders who marked themselves as riding today) are cleaned up.
   */
  private async onRideCancelled(rideId: string) {
    const today = new Date().toISOString().slice(0, 10);
    await db.rideResponse.deleteMany({
      where: { rideId, date: { gte: today } },
    });

    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "ride.responses_cleared",
        message: "Future ride responses cleared after ride cancelled",
        rideId,
      })
    );
  }
}
