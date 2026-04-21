import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import type { components } from "../openapi-types";
import { createNaijaRidesServiceForUser, naijaRidesService } from "../data/index.js";
import type { RequestWithAuth } from "../types/http.js";

type OtpRequest = components["schemas"]["OtpRequest"];
type OtpVerifyRequest = components["schemas"]["OtpVerifyRequest"];
type MeUpdateRequest = components["schemas"]["MeUpdateRequest"];

const getAuthedService = (req: RequestWithAuth) => {
  const { authUserId: userId } = req;
  if (!userId) {
    return undefined;
  }
  return createNaijaRidesServiceForUser(userId);
};

export const requestOtp = (c: Context<OtpRequest>, _req: Request, res: Response) => {
  const { phone } = c.request.requestBody;
  naijaRidesService.requestOtpForPhone(phone);
  res.status(204).send();
};

export const verifyOtp = (c: Context<OtpVerifyRequest>, _req: Request, res: Response) => {
  const { phone, code } = c.request.requestBody;
  if (!naijaRidesService.verifyOtpForPhone(phone, code)) {
    res.status(401).json({ error: "Invalid code" });
    return;
  }
  const token = naijaRidesService.issueTokenForPhone(phone);
  res.json({ token, phone });
};

export const updateMe = (c: Context<MeUpdateRequest>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, company } = c.request.requestBody;
  res.json(service.updateCurrentUserProfile(name, company));
};
