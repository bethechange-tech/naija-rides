import type { Express } from "express";
import { apiReference } from "@scalar/express-api-reference";
import { getMetricsSnapshot } from "../observability/metrics.js";

/** Registers documentation, OpenAPI JSON, and metrics routes. */
export class DocsRoutes {
  constructor(private readonly openApiDocument: unknown) {}

  /** Adds public docs and observability routes to the Express app. */
  register(app: Express) {
    app.get("/openapi.json", (_req, res) => {
      res.json(this.openApiDocument);
    });

    app.get("/metrics", (_req, res) => {
      res.json(getMetricsSnapshot());
    });

    app.use("/docs", apiReference({
      url: "/openapi.json",
      theme: "kepler",
      pageTitle: "NaijaRides API Docs",
    }));
  }
}
