import express from "express";
import { createRequire } from "module";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import addFormats from "ajv-formats";
import { apiReference } from "@scalar/express-api-reference";
import { $RefParser } from "@apidevtools/json-schema-ref-parser";
import rateLimit from "express-rate-limit";
import { TokenResolver } from "./auth/token-resolver.js";
import { ensureNaijaRidesSeeded, findUserIdByToken } from "./data/index.js";
import { registerRideEventSubscribers } from "./events/consumer/index.js";
import { getMetricsSnapshot, recordAuthFailure, recordRequestLatency } from "./observability/metrics.js";
import type { RequestWithAuth } from "./types/http.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OpenAPIBackend = require("openapi-backend").default as typeof import("openapi-backend")["default"];
import * as handlers from "./handlers/index.js";

const app = express();

registerRideEventSubscribers();

await ensureNaijaRidesSeeded();

app.use(express.json());

const getClientIp = (req: express.Request) => {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};


const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${getClientIp(req)}:${req.path}`,
  message: { error: "Too Many Requests" },
});

const otpRequestRateLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = typeof req.body?.phone === "string" ? req.body.phone : "unknown";
    return `otp-request:${getClientIp(req)}:${phone}`;
  },
  message: { error: "Too Many Requests" },
});

const otpVerifyRateLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = typeof req.body?.phone === "string" ? req.body.phone : "unknown";
    return `otp-verify:${getClientIp(req)}:${phone}`;
  },
  message: { error: "Too Many Requests" },
});

app.use((req: RequestWithAuth, res, next) => {
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
      ip: getClientIp(req),
      userAgent: req.header("user-agent") ?? null,
    }));
  });

  next();
});

app.use(globalRateLimiter);
app.use("/auth/otp/request", otpRequestRateLimiter);
app.use("/auth/otp/verify", otpVerifyRateLimiter);

const resolveOpenApiPath = () => {
  const fromEnv = process.env.OPENAPI_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    new URL("../openapi/index.yaml", import.meta.url).pathname,
    new URL("./openapi/index.yaml", import.meta.url).pathname,
    path.resolve(process.cwd(), "openapi/index.yaml"),
    path.resolve(process.cwd(), "dist/openapi/index.yaml"),
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("OpenAPI spec not found. Set OPENAPI_PATH or include openapi/index.yaml in deployment artifacts.");
  }

  return found;
};

const openApiPath = resolveOpenApiPath();
const openApiDocument = await $RefParser.dereference(openApiPath);

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.get("/metrics", (_req, res) => {
  res.json(getMetricsSnapshot());
});

app.use("/docs", apiReference({
  url: "/openapi.json",
  theme: "kepler",
  pageTitle: "NaijaRides API Docs",
}));

const publicPaths = new Set<string>([
  "/health",
  "/locations",
  "/auth/otp/request",
  "/auth/otp/verify",
  "/openapi.json",
  "/metrics",
]);

app.use(async (req: RequestWithAuth, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.path.startsWith("/docs") || publicPaths.has(req.path)) {
    return next();
  }

  const authHeader = req.header("authorization") ?? "";
  
  if (!authHeader.startsWith("Bearer ")) {
    recordAuthFailure("missing_bearer");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const userId = await TokenResolver.resolveUserIdByToken(token, findUserIdByToken);
  if (!userId) {
    recordAuthFailure("invalid_token");
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUserId = userId;
  return next();
});

const api = new OpenAPIBackend({
  definition: openApiPath,
  ajvOpts: { strict: false },
  customizeAjv: (ajv) => { addFormats(ajv); return ajv; },
});

api.register({
  getHealth: handlers.getHealth,
  listLocations: handlers.listLocations,
  requestOtp: handlers.requestOtp,
  verifyOtp: handlers.verifyOtp,
  updateMe: handlers.updateMe,
  searchRides: handlers.searchRides,
  getTodayRide: handlers.getTodayRide,
  respondToRide: handlers.respondToRide,
  joinRide: handlers.joinRide,
  createRide: handlers.createRide,
  getMyRiderRides: handlers.getMyRiderRides,
  getMyDriverRides: handlers.getMyDriverRides,
  cancelRide: handlers.cancelRide,
  cancelBooking: handlers.cancelBooking,
  notFound: handlers.notFound,
  validationFail: handlers.validationFail,
});

await api.init();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(async (req, res, next) => {
  try {
    await api.handleRequest(req as any, req, res);
  } catch (error) {
    next(error);
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const req = _req as RequestWithAuth;
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    event: "unhandled_error",
    requestId: req.requestId ?? null,
    method: req.method,
    path: req.originalUrl,
    userId: req.authUserId ?? null,
    message: err.message,
    stack: err.stack,
  }));
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
