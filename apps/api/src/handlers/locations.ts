import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import { LAGOS_LOCATIONS } from "../data/index.js";

export const listLocations = (c: Context, _req: Request, res: Response) => {
  const q = (c.request.query as Record<string, string>).q;

  if (!q || !q.trim()) {
    res.json(LAGOS_LOCATIONS);
    return;
  }

  const term = q.trim().toLowerCase();
  const results = LAGOS_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(term) ||
      loc.description.toLowerCase().includes(term) ||
      loc.aliases.some((alias) => alias.toLowerCase().includes(term)),
  );

  res.json(results);
};
