import { db } from "@repo/db";
import { RideEventSubscriber } from "./ride-event-subscriber.js";
import type { RideDomainEvent } from "../publisher/types.js";

const eventMessages: Record<RideDomainEvent["eventName"], string> = {
  "ride.created": "Ride created",
  "ride.joined": "Rider joined ride",
  "ride.cancelled": "Ride cancelled",
  "booking.cancelled": "Booking cancelled",
};

export class RideEventLogSubscriber extends RideEventSubscriber {
  protected async handle(event: RideDomainEvent) {
    const [ride, actor] = await Promise.all([
      db.ride.findUnique({
        where: { id: event.rideId },
        select: { from: true, to: true, time: true, status: true, seatsTotal: true },
      }),
      db.user.findUnique({
        where: { id: event.actorUserId },
        select: { name: true, phone: true },
      }),
    ]);

    console.info(
      JSON.stringify({
        timestamp: event.occurredAt,
        level: "info",
        event: event.eventName,
        message: eventMessages[event.eventName],
        rideId: event.rideId,
        route: ride ? `${ride.from} → ${ride.to}` : null,
        rideTime: ride?.time ?? null,
        rideStatus: ride?.status ?? null,
        seatsTotal: ride?.seatsTotal ?? null,
        actorUserId: event.actorUserId,
        actorName: actor?.name ?? null,
        actorPhone: actor?.phone ?? null,
        ...(event.metadata ? { metadata: event.metadata } : {}),
      })
    );
  }
}
