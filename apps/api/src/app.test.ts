import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

const TEST_USER_PHONE = "+2348000000000";

const loginAndGetToken = async () => {
    await request(app)
        .post("/auth/otp/request")
        .send({ phone: TEST_USER_PHONE });

    const verify = await request(app)
        .post("/auth/otp/verify")
        .send({ phone: TEST_USER_PHONE, code: "1234" });

    expect(verify.status).toBe(200);
    expect(typeof verify.body.token).toBe("string");
    return verify.body.token as string;
};

describe("NaijaRides API endpoints", () => {
    it("POST /auth/otp/request", async () => {
        const response = await request(app)
            .post("/auth/otp/request")
            .send({ phone: "+2348012345678" });

        expect([200, 204]).toContain(response.status);
    });

    it("POST /auth/otp/verify", async () => {
        await request(app)
            .post("/auth/otp/request")
            .send({ phone: "+2348099999999" });

        const bad = await request(app)
            .post("/auth/otp/verify")
            .send({ phone: "+2348099999999", code: "0000" });

        expect(bad.status).toBe(401);
        expect(bad.body).toEqual({ error: "Invalid code" });
    });

    it("POST /me", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .post("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Rasul", company: "NaijaRides" });

        expect([200, 204]).toContain(response.status);
        if (response.status === 200) {
            expect(response.body.name).toBe("Rasul");
        }
    });

    it("GET /rides/search", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .get("/rides/search")
            .set("Authorization", `Bearer ${token}`)
            .query({ from: "yAbA", to: "vI" });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /rides/today", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .get("/rides/today")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body === null || typeof response.body === "object").toBe(true);
    });

    it("POST /rides/:rideId/respond", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .post("/rides/ride_001/respond")
            .set("Authorization", `Bearer ${token}`)
            .send({ riding: true });

        expect([200, 204]).toContain(response.status);
    });

    it("POST /rides/:rideId/join", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .post("/rides/ride_002/join")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect([200, 204, 409]).toContain(response.status);
        if (response.status === 409) {
            expect(typeof response.body.error).toBe("string");
        }
    });

    it("POST /rides", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .post("/rides")
            .set("Authorization", `Bearer ${token}`)
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
        const token = await loginAndGetToken();
        const response = await request(app)
            .get("/me/rides/rider")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("driverName");
        }
    });

    it("GET /me/rides/driver", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .get("/me/rides/driver")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("passengersCount");
        }
    });

    it("DELETE /rides/:rideId", async () => {
        const token = await loginAndGetToken();
        const create = await request(app)
            .post("/rides")
            .set("Authorization", `Bearer ${token}`)
            .send({
                from: "Ikeja",
                to: "Lekki",
                time: "6:30 AM",
                seats: 2,
                price: 1800,
                repeatDays: ["Mon", "Wed", "Fri"],
            });

        expect(create.status).toBe(201);

        const response = await request(app)
            .delete(`/rides/${create.body.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(204);
    });

    it("DELETE /me/rides/rider/:bookingId", async () => {
        const token = await loginAndGetToken();
        const response = await request(app)
            .delete("/me/rides/rider/booking_001")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(204);
    });

    it("returns 401 for protected route without token", async () => {
        const response = await request(app).get("/rides/search").query({ from: "Yaba", to: "VI" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Unauthorized" });
    });
});
