import type { Express, NextFunction, Request, Response } from "express";
import type { RequestWithAuth } from "../types/http.js";

/** Handles uncaught route errors with structured logs and JSON responses. */
export class ErrorHandler {
  /** Express error middleware. */
  middleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
  };

  /** Registers the error handler after all routes. */
  register(app: Express) {
    app.use(this.middleware);
  }
}
