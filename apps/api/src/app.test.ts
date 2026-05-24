import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@repo/db";
import app from "./app.js";
import { resetNaijaRidesData } from "./data/index.js";

const TEST_USER_PHONE = "+2348000000000";
const UNWHITELISTED_PHONE = "+2348099999999";

type PilotAuthSession = {
    token: string;
    accessToken: string;
    refreshToken: string;
    cookie: string;
};

const toCookieHeader = (setCookieHeader: string | string[] | undefined) => {
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
    return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
};

const requestPilotOtp = (phone: string = TEST_USER_PHONE) => {
    return request(app).post("/auth/otp/request").send({ phone });
};

const verifyPilotOtp = (phone: string = TEST_USER_PHONE, code = "1234") => {
    return request(app).post("/auth/otp/verify").send({ phone, code });
};

const createPilotAuthSession = async (): Promise<PilotAuthSession> => {
    await requestPilotOtp();

    const verify = await verifyPilotOtp();

    expect(verify.status).toBe(200);
    expect(typeof verify.body.token).toBe("string");
    expect(typeof verify.body.accessToken).toBe("string");
    expect(typeof verify.body.refreshToken).toBe("string");
    expect(verify.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringContaining("nr_access_token="),
        expect.stringContaining("nr_refresh_token="),
    ]));

    return {
        token: verify.body.token as string,
        accessToken: verify.body.accessToken as string,
        refreshToken: verify.body.refreshToken as string,
        cookie: toCookieHeader(verify.headers["set-cookie"]),
    };
};

const withPilotAuth = (requestBuilder: request.Test, session: PilotAuthSession) => {
    return requestBuilder
        .set("Authorization", `Bearer ${session.token}`)
        .set("Cookie", session.cookie);
};

beforeEach(async () => {
    await resetNaijaRidesData();
});

describe("NaijaRides API endpoints", () => {
    describe("Given the MVP auth pilot is running", () => {
        it("When a whitelisted phone requests OTP, Then the backend accepts it and stores code 1234", async () => {
            const response = await requestPilotOtp();

            expect(response.status).toBe(204);
            const stored = await db.otpCode.findUnique({ where: { phone: TEST_USER_PHONE } });
            expect(stored?.code).toBe("1234");
        });

        it("When an unwhitelisted phone requests OTP, Then the backend rejects it", async () => {
            const response = await requestPilotOtp(UNWHITELISTED_PHONE);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ error: "Phone number is not whitelisted" });
        });

        it("When a whitelisted phone verifies 1234, Then it returns access and refresh tokens", async () => {
            await requestPilotOtp();

            const response = await verifyPilotOtp();

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                phone: TEST_USER_PHONE,
                token: expect.any(String),
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            });
            expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
                expect.stringContaining("nr_access_token="),
                expect.stringContaining("nr_refresh_token="),
            ]));

            const authToken = await db.authToken.findFirst({ where: { token: response.body.accessToken } });
            expect((authToken as { refreshToken?: string } | null)?.refreshToken).toBe(response.body.refreshToken);
        });

        it("When a whitelisted phone verifies an invalid code, Then the backend rejects it", async () => {
            await requestPilotOtp();

            const bad = await verifyPilotOtp(TEST_USER_PHONE, "0000");

            expect(bad.status).toBe(401);
            expect(bad.body).toEqual({ error: "Invalid code" });
        });
    });

    it("When auth cookies are issued, Then protected routes work without a bearer token", async () => {
        const { cookie } = await createPilotAuthSession();

        const response = await request(app)
            .get("/me")
            .set("Cookie", cookie);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            phone: TEST_USER_PHONE,
            name: "",
            company: "",
        });
    });

    it("POST /me", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).post("/me"), session)
            .send({ name: "Rasul", company: "NaijaRides" });

        expect([200, 204]).toContain(response.status);
        
        if (response.status === 200) {
            expect(response.body.name).toBe("Rasul");
        }
    });

    it("GET /me", async () => {
        const session = await createPilotAuthSession();
        await withPilotAuth(request(app).post("/me"), session)
            .send({ name: "Rasul", company: "NaijaRides" });

        const response = await withPilotAuth(request(app).get("/me"), session);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            phone: TEST_USER_PHONE,
            name: "Rasul",
            company: "NaijaRides",
        });
    });

    it("GET /rides/search", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).get("/rides/search"), session)
            .query({ from: "yAbA", to: "vI" });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /rides/today", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).get("/rides/today"), session);

        expect(response.status).toBe(200);
        expect(response.body === null || typeof response.body === "object").toBe(true);
    });

    it("POST /rides/:rideId/respond", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).post("/rides/ride_001/respond"), session)
            .send({ riding: true });

        expect([200, 204]).toContain(response.status);
    });

    it("POST /rides/:rideId/join", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).post("/rides/ride_002/join"), session)
            .send({});

        expect([200, 204, 409]).toContain(response.status);
        if (response.status === 409) {
            expect(typeof response.body.error).toBe("string");
        }
    });

    it("POST /rides", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).post("/rides"), session)
            .send({
                from: "Yaba",
                to: "VI",
                time: "9:00 AM",
                seats: 3,
                price: 2500,
                repeatDays: ["Mon", "Tue"],
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            from: "Yaba",
            to: "VI",
            seatsTotal: 3,
            price: 2500,
            status: "active",
        });
    });

    it("GET /me/rides/rider", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).get("/me/rides/rider"), session);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("driverName");
            expect(response.body[0]).toHaveProperty("repeatDays");
            expect(Array.isArray(response.body[0].repeatDays)).toBe(true);
        }
    });

    it("GET /me/rides/driver", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).get("/me/rides/driver"), session);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("passengersCount");
            expect(response.body[0]).toHaveProperty("repeatDays");
            expect(Array.isArray(response.body[0].repeatDays)).toBe(true);
        }
    });

    it("DELETE /rides/:rideId", async () => {
        const session = await createPilotAuthSession();
        const create = await withPilotAuth(request(app).post("/rides"), session)
            .send({
                from: "Ikeja",
                to: "Lekki",
                time: "6:30 AM",
                seats: 2,
                price: 1800,
                repeatDays: ["Mon", "Wed", "Fri"],
            });

        expect(create.status).toBe(201);

        const response = await withPilotAuth(request(app).delete(`/rides/${create.body.id}`), session);
        expect(response.status).toBe(204);
    });

    it("DELETE /me/rides/rider/:bookingId", async () => {
        const session = await createPilotAuthSession();
        const response = await withPilotAuth(request(app).delete("/me/rides/rider/booking_001"), session);

        expect(response.status).toBe(204);
    });

    it("GET /locations returns all locations", async () => {
        const response = await request(app).get("/locations");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toMatchObject({ id: expect.any(String), name: expect.any(String), aliases: expect.any(Array) });
    });

    it("GET /locations?q= filters by name and alias", async () => {
        const byName = await request(app).get("/locations").query({ q: "ikeja" });
        expect(byName.status).toBe(200);
        expect(byName.body.some((l: { name: string }) => l.name === "Ikeja")).toBe(true);

        const byAlias = await request(app).get("/locations").query({ q: "computer village" });
        expect(byAlias.status).toBe(200);
        expect(byAlias.body.some((l: { name: string }) => l.name === "Ikeja")).toBe(true);

        const noMatch = await request(app).get("/locations").query({ q: "zzznomatch" });
        expect(noMatch.status).toBe(200);
        expect(noMatch.body).toEqual([]);
    });

    it("returns 401 for protected route without token", async () => {
        const response = await request(app).get("/rides/search").query({ from: "Yaba", to: "VI" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized" });
    });
});
