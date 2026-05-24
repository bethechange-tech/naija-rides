import { createRequire } from "module";
import type { Express } from "express";
import addFormats from "ajv-formats";
import * as handlers from "../handlers/index.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OpenAPIBackend = require("openapi-backend").default as typeof import("openapi-backend")["default"];

/** Registers OpenAPI-backed application routes and handlers. */
export class OpenApiBackendRoutes {
  constructor(private readonly openApiPath: string) {}

  /** Builds the OpenAPI backend and mounts it on the Express app. */
  async register(app: Express) {
    const api = new OpenAPIBackend({
      definition: this.openApiPath,
      ajvOpts: { strict: false },
      customizeAjv: (ajv) => { addFormats(ajv); return ajv; },
    });

    api.register({
      getHealth: handlers.getHealth,
      listLocations: handlers.listLocations,
    requestOtp: handlers.requestOtp,
    verifyOtp: handlers.verifyOtp,
    getMe: handlers.getMe,
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
  }
}
