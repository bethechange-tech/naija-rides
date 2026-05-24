import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_USER_ID } from "./index.js";
import { NaijaRidesService } from "./naija-rides-db.js";

const makeMockDatabase = () => {
  const tx = {
    user: {
      upsert: vi.fn(),
    },
    otpCode: {
      upsert: vi.fn(),
    },
  };

  const database = {
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
    whitelistedPhone: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    otpCode: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    authToken: {
      create: vi.fn(),
    },
  };

  return { database, tx };
};

describe("NaijaRidesService MVP auth flow (BDD)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Given a phone number is whitelisted", () => {
    it("When requesting an OTP, Then stores the fixed mock code", async () => {
      const { database, tx } = makeMockDatabase();
      database.whitelistedPhone.findUnique.mockResolvedValue({ phone: "+2348000000000" });
      tx.user.upsert.mockResolvedValue({ id: "user_001" });
      tx.otpCode.upsert.mockResolvedValue({});

      const service = new NaijaRidesService(CURRENT_USER_ID, database as never);
      const accepted = await service.requestOtpForPhone("+2348000000000");

      expect(accepted).toBe(true);
      expect(database.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.otpCode.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: "+2348000000000" },
          update: expect.objectContaining({ code: "1234" }),
          create: expect.objectContaining({ phone: "+2348000000000", code: "1234" }),
        }),
      );
    });

    it("When verifying with code 1234, Then accepts the login and removes the stored code", async () => {
      const { database } = makeMockDatabase();
      database.whitelistedPhone.findUnique.mockResolvedValue({ phone: "+2348000000000" });
      database.otpCode.findUnique.mockResolvedValue({ code: "1234", expiresAt: new Date(Date.now() + 60_000) });
      database.otpCode.delete.mockResolvedValue({});

      const service = new NaijaRidesService(CURRENT_USER_ID, database as never);
      const accepted = await service.verifyOtpForPhone("+2348000000000", "1234");

      expect(accepted).toBe(true);
      expect(database.otpCode.delete).toHaveBeenCalledWith({ where: { phone: "+2348000000000" } });
    });
  });

  describe("Given a phone number is not whitelisted", () => {
    it("When requesting an OTP, Then rejects the request without opening a transaction", async () => {
      const { database, tx } = makeMockDatabase();
      database.whitelistedPhone.findUnique.mockResolvedValue(null);

      const service = new NaijaRidesService(CURRENT_USER_ID, database as never);
      const accepted = await service.requestOtpForPhone("+2348011111111");

      expect(accepted).toBe(false);
      expect(database.$transaction).not.toHaveBeenCalled();
      expect(tx.user.upsert).not.toHaveBeenCalled();
      expect(tx.otpCode.upsert).not.toHaveBeenCalled();
    });

    it("When verifying any code, Then rejects the login", async () => {
      const { database } = makeMockDatabase();
      database.whitelistedPhone.findUnique.mockResolvedValue(null);

      const service = new NaijaRidesService(CURRENT_USER_ID, database as never);
      const accepted = await service.verifyOtpForPhone("+2348011111111", "1234");

      expect(accepted).toBe(false);
      expect(database.otpCode.delete).not.toHaveBeenCalled();
    });
  });

  describe("Given a verified phone number with a user record", () => {
    it("When issuing auth tokens, Then returns access and refresh tokens and persists both", async () => {
      const { database } = makeMockDatabase();
      database.user.findUnique.mockResolvedValue({ id: "user_001" });
      database.authToken.create.mockResolvedValue({});

      const service = new NaijaRidesService(CURRENT_USER_ID, database as never);
      const result = await service.issueTokenForPhone("+2348000000000");

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.accessToken).not.toBe(result.refreshToken);
      expect(database.authToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            token: result.accessToken,
            refreshToken: result.refreshToken,
            userId: "user_001",
          },
        }),
      );
    });
  });
});