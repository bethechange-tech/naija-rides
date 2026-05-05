-- Enforce one booking record per user and ride.
-- This supports idempotent joins and avoids duplicate rider reservations.
CREATE UNIQUE INDEX "ride_bookings_ride_id_rider_user_id_key"
ON "ride_bookings"("ride_id", "rider_user_id");
