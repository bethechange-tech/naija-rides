
import { JobType, QUEUE_NAME, redis } from "@repo/queue";
import { Worker } from "bullmq";
import { runGeneratePosts } from "./jobs/generate-posts";
import { runNotifyRideEvent, runTrackRideEvent } from "./jobs/ride-events";

const runners = {
  [JobType.GeneratePosts]: runGeneratePosts,
  [JobType.NotifyRideEvent]: runNotifyRideEvent,
  [JobType.TrackRideEvent]: runTrackRideEvent,
};

new Worker(
  QUEUE_NAME,
  async (job) => {
    const runner = runners[job.name as JobType];
    if (!runner) {
      console.error(`Unknown job type`, job.name);
      throw new Error(`Unknown job type ${job.name}`);
    }

    const queueLagMs = Date.now() - job.timestamp;
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        metric: "queue_lag_ms",
        jobName: job.name,
        value: queueLagMs,
      })
    );

    console.log(`[${job.id}] ${job.name} - Running...`, job.data);
    await runner(job.data);
    console.log(`[${job.id}] ${job.name} - Completed`);
  },
  { connection: redis }
);
