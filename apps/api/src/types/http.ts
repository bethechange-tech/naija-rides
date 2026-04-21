import type { Request } from "express";

export type RequestWithAuth = Request & {
  authUserId?: string;
};
