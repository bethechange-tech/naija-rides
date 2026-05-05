import { existsSync, readdirSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { GenericContainer, Wait } from "testcontainers";

const waitForPort = async (host: string, port: number, timeoutMs: number) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const isReady = await new Promise<boolean>((resolve) => {
            const socket = net.createConnection({ host, port });

            socket.once("connect", () => {
                socket.end();
                resolve(true);
            });

            socket.once("error", () => {
                socket.destroy();
                resolve(false);
            });
        });

        if (isReady) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Timed out waiting for Postgres at ${host}:${port}`);
};

const waitForPostgres = async (
    container: { exec: (command: string[]) => Promise<{ exitCode: number; output: string }> },
    timeoutMs: number,
) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const result = await container.exec(["pg_isready", "-U", "postgres", "-d", "NR_LAGOS_test"]);
        if (result.exitCode === 0) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error("Timed out waiting for Postgres readiness inside the test container");
};

const splitSqlStatements = (sql: string) => {
    const statements: string[] = [];
    let current = "";

    for (const line of sql.split(/\r?\n/)) {
        current += `${line}\n`;
        if (line.trim().endsWith(";")) {
            const statement = current.trim();
            if (statement) {
                statements.push(statement);
            }
            current = "";
        }
    }

    const trailing = current.trim();
    if (trailing) {
        statements.push(trailing);
    }

    return statements;
};

const prepareDatabase = async (databaseUrl: string, statements: string[]) => {
    let lastError: unknown;
    let lastStatement = "";

    for (let attempt = 1; attempt <= 10; attempt += 1) {
        const client = new Client({ connectionString: databaseUrl });

        try {
            await client.connect();
            for (const statement of statements) {
                lastStatement = statement;
                await client.query(statement);
            }
            await client.end();
            return;
        } catch (error) {
            lastError = error;
            try {
                await client.end();
            } catch {
                // Ignore cleanup failure between retries.
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    const statementPreview = lastStatement.split("\n").slice(0, 3).join(" ");
    throw new Error(`Failed to prepare test database from migration SQL after retries. ${message} ${statementPreview}`.trim());
};

export default async function globalSetup() {
    process.env.NODE_ENV = "test";

    // Load DATABASE_URL from packages/db/.env if it isn't already set in the OS environment.
    // This mirrors what db.ts does at runtime and lets CI (with a real DATABASE_URL) skip
    // the testcontainer entirely.
    if (!process.env.DATABASE_URL) {
        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const repoRoot = path.resolve(currentDir, "..", "..", "..");
        const envFile = path.resolve(repoRoot, "packages/db/.env");
        if (existsSync(envFile)) {
            for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) continue;
                const eq = trimmed.indexOf("=");
                if (eq <= 0) continue;
                const key = trimmed.slice(0, eq).trim();
                let value = trimmed.slice(eq + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!(key in process.env)) {
                    process.env[key] = value;
                }
            }
        }
    }

    // If DATABASE_URL is now set (OS env or .env file), use that database — no container needed.
    if (process.env.DATABASE_URL) {
        return;
    }

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const appDir = path.resolve(currentDir, "..");
    const repoRoot = path.resolve(appDir, "..", "..");
    const migrationsDir = path.resolve(repoRoot, "packages/db/prisma/migrations");

    if (!existsSync(migrationsDir)) {
        throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    // Collect all migration SQL files in chronological order (directory names are timestamps).
    const migrationSql = readdirSync(migrationsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((dir) => {
            const sqlFile = path.join(migrationsDir, dir.name, "migration.sql");
            return existsSync(sqlFile) ? [readFileSync(sqlFile, "utf8")] : [];
        })
        .join("\n");

    const container = await new GenericContainer("postgres:16")
        .withEnvironment({
            POSTGRES_USER: "postgres",
            POSTGRES_PASSWORD: "postgres",
            POSTGRES_DB: "NR_LAGOS_test",
        })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
        .start();

    // Use the dynamically assigned host port — avoids hard-coded port conflicts.
    const host = container.getHost() === "localhost" ? "127.0.0.1" : container.getHost();
    const port = container.getMappedPort(5432);

    await waitForPort(host, port, 15_000);
    await waitForPostgres(container, 15_000);

    const databaseUrl = `postgresql://postgres:postgres@${host}:${port}/NR_LAGOS_test?schema=public`;
    process.env.DATABASE_URL = databaseUrl;

    const statements = splitSqlStatements(migrationSql);
    await prepareDatabase(databaseUrl, statements);

    return async () => {
        await container.stop();
    };
}

