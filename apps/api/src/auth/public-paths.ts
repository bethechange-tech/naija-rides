/** Public API paths that do not require bearer token auth. */
export class PublicPaths {
  static readonly paths = new Set<string>([
    "/health",
    "/locations",
    "/auth/otp/request",
    "/auth/otp/verify",
    "/openapi.json",
    "/metrics",
  ]);
}
