import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { ClientIpResolver } from "../http/client-ip.js";

/** Registers global and auth-specific rate limit middleware. */
export class RateLimiters {
  private readonly globalRateLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${ClientIpResolver.resolve(req)}:${req.path}`,
    message: { error: "Too Many Requests" },
  });

  private readonly otpRequestRateLimiter = rateLimit({
    windowMs: 10 * 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const phone = typeof req.body?.phone === "string" ? req.body.phone : "unknown";
      return `otp-request:${ClientIpResolver.resolve(req)}:${phone}`;
    },
    message: { error: "Too Many Requests" },
  });

  private readonly otpVerifyRateLimiter = rateLimit({
    windowMs: 10 * 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const phone = typeof req.body?.phone === "string" ? req.body.phone : "unknown";
      return `otp-verify:${ClientIpResolver.resolve(req)}:${phone}`;
    },
    message: { error: "Too Many Requests" },
  });

  /** Adds all API rate limiters to the Express app. */
  register(app: Express) {
    app.use(this.globalRateLimiter);
    app.use("/auth/otp/request", this.otpRequestRateLimiter);
    app.use("/auth/otp/verify", this.otpVerifyRateLimiter);
  }
}
