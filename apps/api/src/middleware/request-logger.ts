import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import { ClientIpResolver } from "../http/client-ip.js";
import { recordRequestLatency } from "../observability/metrics.js";
import type { RequestWithAuth } from "../types/http.js";

/** Adds request IDs and writes structured request logs. */
export class RequestLogger {
  /** Express middleware for per-request logging and latency metrics. */
  middleware = (req: RequestWithAuth, res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    res.setHeader("x-request-id", req.requestId);

    const started = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - started;

      recordRequestLatency(durationMs);

      console.info(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "http_request",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userId: req.authUserId ?? null,
        ip: ClientIpResolver.resolve(req),
        userAgent: req.header("user-agent") ?? null,
      }));

    });

    next();
  };
}
