import express from "express";
import { Authoriser } from "./auth/authoriser.js";
import { PublicPaths } from "./auth/public-paths.js";
import { NaijaRidesSeeder } from "./data/index.js";
import { RideEventSubscribers } from "./events/consumer/index.js";
import { ErrorHandler } from "./middleware/error-handler.js";
import { RateLimiters } from "./middleware/rate-limiters.js";
import { RequestLogger } from "./middleware/request-logger.js";
import { OpenApiSpec } from "./openapi/spec.js";
import { DocsRoutes } from "./routes/docs.js";
import { OpenApiBackendRoutes } from "./routes/openapi-backend.js";

const app = express();
app.set("trust proxy", 1);

const rideEventSubscribers = new RideEventSubscribers();
const naijaRidesSeeder = new NaijaRidesSeeder();

rideEventSubscribers.register();

await naijaRidesSeeder.ensureSeeded();

app.use(express.json());

const requestLogger = new RequestLogger();
const rateLimiters = new RateLimiters();
const openApiSpec = new OpenApiSpec();

app.use(requestLogger.middleware);
rateLimiters.register(app);

const openApiPath = openApiSpec.resolvePath();
const openApiDocument = await openApiSpec.loadDocument(openApiPath);

new DocsRoutes(openApiDocument).register(app);

app.use(new Authoriser(PublicPaths.paths).middleware);

await new OpenApiBackendRoutes(openApiPath).register(app);

new ErrorHandler().register(app);

export default app;
