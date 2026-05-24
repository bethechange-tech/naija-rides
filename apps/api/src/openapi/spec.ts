import { existsSync } from "node:fs";
import path from "node:path";
import { $RefParser } from "@apidevtools/json-schema-ref-parser";

/** Locates and loads the OpenAPI specification. */
export class OpenApiSpec {
  /** Resolves the OpenAPI YAML path from env or known build locations. */
  resolvePath() {
    const fromEnv = process.env.OPENAPI_PATH;
    if (fromEnv && existsSync(fromEnv)) return fromEnv;

    const candidates = [
      new URL("../../openapi/index.yaml", import.meta.url).pathname,
      new URL("../openapi/index.yaml", import.meta.url).pathname,
      path.resolve(process.cwd(), "openapi/index.yaml"),
      path.resolve(process.cwd(), "dist/openapi/index.yaml"),
    ];

    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new Error("OpenAPI spec not found. Set OPENAPI_PATH or include openapi/index.yaml in deployment artifacts.");
    }

    return found;
  }

  /** Loads and dereferences the OpenAPI document. */
  async loadDocument(openApiPath: string) {
    return await $RefParser.dereference(openApiPath);
  }
}
