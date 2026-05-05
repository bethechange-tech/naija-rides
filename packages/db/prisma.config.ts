import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Prisma datasource connections.");
}

if (!directUrl) {
  throw new Error("DIRECT_URL is required for Prisma migrate direct connections.");
}

export default defineConfig({
  // earlyAccess: true,
  schema: path.join(import.meta.dirname, "prisma/schema.prisma"),
  datasource: {
    url: directUrl,
  },
  // migrate: {
  //   async url() {
  //     return directUrl;
  //   },
  // },
});
