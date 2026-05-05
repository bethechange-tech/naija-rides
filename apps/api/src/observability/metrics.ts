type CounterName = "auth_failures_total" | "join_conflicts_total";

type CounterLabels = Record<string, string>;

type CounterMap = Map<string, number>;

const counters: Record<CounterName, CounterMap> = {
  auth_failures_total: new Map<string, number>(),
  join_conflicts_total: new Map<string, number>(),
};

const requestMetrics = {
  total: 0,
  totalDurationMs: 0,
  maxDurationMs: 0,
};

const labelsKey = (labels: CounterLabels) =>
  Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");

const incCounter = (name: CounterName, labels: CounterLabels) => {
  const key = labelsKey(labels);
  const prev = counters[name].get(key) ?? 0;
  const next = prev + 1;
  counters[name].set(key, next);
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      metric: name,
      labels,
      value: next,
    })
  );
};

export const recordRequestLatency = (durationMs: number) => {
  requestMetrics.total += 1;
  requestMetrics.totalDurationMs += durationMs;
  requestMetrics.maxDurationMs = Math.max(requestMetrics.maxDurationMs, durationMs);
};

export const recordAuthFailure = (reason: "missing_bearer" | "invalid_token") => {
  incCounter("auth_failures_total", { reason });
};

export const recordJoinConflict = (reason: "already_joined" | "ride_full") => {
  incCounter("join_conflicts_total", { reason });
};

export const getMetricsSnapshot = () => {
  const avgDurationMs = requestMetrics.total === 0
    ? 0
    : Number((requestMetrics.totalDurationMs / requestMetrics.total).toFixed(2));

  return {
    request_latency_ms: {
      count: requestMetrics.total,
      avg: avgDurationMs,
      max: requestMetrics.maxDurationMs,
    },
    auth_failures_total: Object.fromEntries(counters.auth_failures_total.entries()),
    join_conflicts_total: Object.fromEntries(counters.join_conflicts_total.entries()),
  };
};
