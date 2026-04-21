import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import type { paths } from "../openapi-types";

type JsonSchema = {
  type?: string;
  enum?: Array<string | number | boolean>;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minimum?: number;
  format?: string;
  description?: string;
};

type SchemaFile = Record<string, JsonSchema>;

type RideDto = NonNullable<paths["/rides/search"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type RiderBookingItem = NonNullable<paths["/me/rides/rider"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type DriverRideItem = NonNullable<paths["/me/rides/driver"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type UserSeed = { id: string; phone: string; name: string; company?: string };
type RideBookingSeed = { id: string; rideId: string; riderUserId: string; cancelledAt?: string };
type RideResponseSeed = { userId: string; rideId: string; date: string; riding: boolean };

const resolveSchemaPath = (schemaFileName: string): string => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Runtime from src/data/openapi-mock.ts
    path.resolve(moduleDir, "../../openapi/schemas", schemaFileName),
    // Runtime from dist/index.js (bundled)
    path.resolve(moduleDir, "../openapi/schemas", schemaFileName),
    // Runtime with CWD at apps/api
    path.resolve(process.cwd(), "openapi/schemas", schemaFileName),
    // Runtime with CWD at monorepo root
    path.resolve(process.cwd(), "apps/api/openapi/schemas", schemaFileName),
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`OpenAPI schema not found for ${schemaFileName}`);
  }

  return found;
};

const readSchemaFile = (schemaFileName: string): SchemaFile => {
  const content = readFileSync(resolveSchemaPath(schemaFileName), "utf-8");
  return YAML.parse(content) as SchemaFile;
};

const ridesSchemas = readSchemaFile("rides.yaml");
const modelSchemas = readSchemaFile("model.yaml");

const sampleFromSchema = (schema: JsonSchema): unknown => {
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];

  if (schema.type === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      result[key] = sampleFromSchema(propSchema);
    }
    return result;
  }

  if (schema.type === "array") {
    if (!schema.items) return [];
    return [sampleFromSchema(schema.items)];
  }

  if (schema.type === "integer" || schema.type === "number") {
    return schema.minimum ?? 1;
  }

  if (schema.type === "boolean") {
    return true;
  }

  if (schema.type === "string") {
    if (schema.format === "date-time") return new Date(0).toISOString();
    if (schema.description?.toLowerCase().includes("display time")) return "7:30 AM";
    if (schema.description?.toLowerCase().includes("iso date")) return "2026-01-01";
    return "string";
  }

  return null;
};

export class OpenApiMockFactory {
  sampleRide(overrides: Partial<RideDto> = {}): RideDto {
    const base = sampleFromSchema(ridesSchemas.Ride) as RideDto;
    return { ...base, ...overrides };
  }

  sampleRiderBookingItem(overrides: Partial<RiderBookingItem> = {}): RiderBookingItem {
    const base = sampleFromSchema(ridesSchemas.RiderBookingItem) as RiderBookingItem;
    return { ...base, ...overrides };
  }

  sampleDriverRideItem(overrides: Partial<DriverRideItem> = {}): DriverRideItem {
    const base = sampleFromSchema(ridesSchemas.DriverRideItem) as DriverRideItem;
    return { ...base, ...overrides };
  }

  sampleUserRow(overrides: Partial<UserSeed> = {}): UserSeed {
    const base = sampleFromSchema(modelSchemas.UserRow) as UserSeed;
    return { ...base, ...overrides };
  }

  sampleRideBookingRow(overrides: Partial<RideBookingSeed> = {}): RideBookingSeed {
    const base = sampleFromSchema(modelSchemas.RideBookingRow) as RideBookingSeed;
    return { ...base, ...overrides };
  }

  sampleRideResponseRow(overrides: Partial<RideResponseSeed> = {}): RideResponseSeed {
    const base = sampleFromSchema(modelSchemas.RideResponseRow) as RideResponseSeed;
    return { ...base, ...overrides };
  }
}
