import type { Context } from "openapi-backend";
import type { Request, Response } from "express";

export const notFound = (_c: Context, _req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

export const validationFail = (c: Context, _req: Request, res: Response) => {
  res.status(422).json({ error: c.validation.errors });
};
