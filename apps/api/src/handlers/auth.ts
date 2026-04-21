import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import type { components } from "../openapi-types";
import { naijaRidesService } from "../data/index.js";

type OtpRequest = components["schemas"]["OtpRequest"];
type OtpVerifyRequest = components["schemas"]["OtpVerifyRequest"];
type MeUpdateRequest = components["schemas"]["MeUpdateRequest"];

export const requestOtp = (c: Context, _req: Request, res: Response) => {
  const { phone } = c.request.requestBody as OtpRequest;
  naijaRidesService.requestOtpForPhone(phone);
  res.status(204).send();
};

export const verifyOtp = (c: Context, _req: Request, res: Response) => {
  const { phone, code } = c.request.requestBody as OtpVerifyRequest;
  if (!naijaRidesService.verifyOtpForPhone(phone, code)) {
    res.status(401).json({ error: "Invalid code" });
    return;
  }
  const token = naijaRidesService.issueTokenForPhone(phone);
  res.json({ token, phone });
};

export const updateMe = (c: Context, _req: Request, res: Response) => {
  const { name, company } = c.request.requestBody as MeUpdateRequest;
  res.json(naijaRidesService.updateCurrentUserProfile(name, company));
};
