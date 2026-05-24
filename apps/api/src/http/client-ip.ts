import type { Request } from "express";

/** Resolves the best client IP address for rate limits and logs. */
export class ClientIpResolver {
  /** Uses x-forwarded-for first, then falls back to Express/socket IPs. */
  static resolve(req: Request) {
    const forwarded = req.header("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }

    return req.ip || req.socket.remoteAddress || "unknown";
  }
}
