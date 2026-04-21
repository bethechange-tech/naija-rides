import express from "express";
import { createRequire } from "module";
import { existsSync } from "node:fs";
import path from "node:path";
import addFormats from "ajv-formats";
import { apiReference } from "@scalar/express-api-reference";
import { $RefParser } from "@apidevtools/json-schema-ref-parser";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OpenAPIBackend = require("openapi-backend").default as typeof import("openapi-backend")["default"];
import * as handlers from "./handlers/index.js";

const app = express();

app.use(express.json());

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

app.use("/docs", apiReference({
  url: "/openapi.json",
  theme: "kepler",
  pageTitle: "NaijaRides API Docs",
}));

const api = new OpenAPIBackend({
  definition: openApiPath,
  ajvOpts: { strict: false },
  customizeAjv: (ajv) => { addFormats(ajv); return ajv; },
});

api.register({
  getHealth: handlers.getHealth,
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
app.use((req, res) => api.handleRequest(req as any, req, res));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
