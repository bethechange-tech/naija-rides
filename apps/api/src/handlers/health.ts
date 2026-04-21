import type { Context } from "openapi-backend";
import type { Request, Response } from "express";

export const getHealth = (_c: Context, _req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
};
