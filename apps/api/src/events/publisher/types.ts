export type RideDomainEventName =
  | "ride.created"
  | "ride.joined"
  | "ride.cancelled"
  | "booking.cancelled";

export type RideDomainEvent = {
  eventName: RideDomainEventName;
  rideId: string;
  actorUserId: string;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface RideEventPublisher {
  publish(event: RideDomainEvent): Promise<void>;
}
