import type { JobData, JobType } from "@repo/queue";

export const runNotifyRideEvent = async (
  data: JobData[JobType.NotifyRideEvent]
) => {
  // MVP: structured log sink for notifications pipeline.
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "notification_enqueued",
      name: data.eventName,
      rideId: data.rideId,
      actorUserId: data.actorUserId,
      occurredAt: data.occurredAt,
      metadata: data.metadata ?? {},
    })
  );
};

export const runTrackRideEvent = async (
  data: JobData[JobType.TrackRideEvent]
) => {
  // MVP: structured log sink for analytics pipeline.
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "analytics_track",
      name: data.eventName,
      rideId: data.rideId,
      actorUserId: data.actorUserId,
      occurredAt: data.occurredAt,
      metadata: data.metadata ?? {},
    })
  );
};
