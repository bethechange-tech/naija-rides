import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import type { components } from "../openapi-types";
import { createNaijaRidesServiceForUser, naijaRidesService } from "../data/index.js";
import type { RequestWithAuth } from "../types/http.js";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../auth/cookies.js";

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
  const phone = c.request.requestBody.phone.trim();
  return naijaRidesService.requestOtpForPhone(phone).then((accepted) => {
    if (!accepted) {
      res.status(403).json({ error: "Phone number is not whitelisted" });
      return;
    }
    res.status(204).send();
  });
};

export const verifyOtp = async (c: Context<OtpVerifyRequest>, _req: Request, res: Response) => {
  const phone = c.request.requestBody.phone.trim();
  const code = c.request.requestBody.code.trim();
  if (!(await naijaRidesService.verifyOtpForPhone(phone, code))) {
    res.status(401).json({ error: "Invalid code" });
    return;
  }

  const { accessToken, refreshToken } = await naijaRidesService.issueTokenForPhone(phone);
  if (!accessToken || !refreshToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, accessTokenCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshTokenCookieOptions);
  res.json({ token: accessToken, accessToken, refreshToken, phone });
};

export const getMe = async (_c: Context, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await service.getCurrentUserProfile();
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(profile);
};

export const updateMe = async (c: Context<MeUpdateRequest>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, company } = c.request.requestBody;
  res.json(await service.updateCurrentUserProfile(name, company));
};
