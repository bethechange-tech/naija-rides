
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const loadDatabaseUrlFromEnvFile = () => {
  if (process.env.DATABASE_URL) {
    return;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(currentDir, "../.env"),
    path.resolve(currentDir, "../../.env"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    const contents = readFileSync(candidate, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }

    if (process.env.DATABASE_URL) {
      return;
    }
  }
};

loadDatabaseUrlFromEnvFile();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize PrismaClient");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let db: PrismaClient;

const isServer =
  typeof process !== "undefined" && process.versions && process.versions.node;
if (isServer) {
  if (process.env.NODE_ENV === "production") {
    db = new PrismaClient({ adapter });
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        adapter,
        log: ["query", "info", "warn", "error"],
      });
    }
    db = global.prisma;
  }
}

export { db };
