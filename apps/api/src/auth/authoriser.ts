import type { NextFunction, Response } from "express";
import { TokenResolver } from "./token-resolver.js";
import { findUserIdByToken } from "../data/index.js";
import { recordAuthFailure } from "../observability/metrics.js";
import type { RequestWithAuth } from "../types/http.js";
import { ACCESS_TOKEN_COOKIE_NAME } from "./cookies.js";

/** Checks protected API requests for a valid bearer token. */
export class Authoriser {
  constructor(private readonly publicPaths: Set<string>) {}

  private readTokenFromCookies(cookieHeader: string) {
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf("=");
          if (separatorIndex <= 0) {
            return [part, ""];
          }

          return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
        }),
    );

    return cookies[ACCESS_TOKEN_COOKIE_NAME] ?? cookies.accessToken ?? undefined;
  }

  /** Express middleware that attaches the authenticated user id to the request. */
  middleware = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    if (req.path.startsWith("/docs") || this.publicPaths.has(req.path)) {
      return next();
    }

    const authHeader = req.header("authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : undefined;
    const cookieToken = this.readTokenFromCookies(req.header("cookie") ?? "");
    const token = bearerToken ?? cookieToken;

    if (!token) {
      recordAuthFailure("missing_bearer");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await TokenResolver.resolveUserIdByToken(token, findUserIdByToken);
    if (!userId) {
      recordAuthFailure("invalid_token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.authUserId = userId;
    return next();
  };
}
