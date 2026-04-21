import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

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
        const response = await request(app)
            .post("/me")
            .send({ name: "Rasul", company: "NaijaRides" });

        expect([200, 204]).toContain(response.status);
        if (response.status === 200) {
            expect(response.body.name).toBe("Rasul");
        }
    });

    it("GET /rides/search", async () => {
        const response = await request(app)
            .get("/rides/search")
            .query({ from: "yAbA", to: "vI" });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /rides/today", async () => {
        const response = await request(app).get("/rides/today");

        expect(response.status).toBe(200);
        expect(response.body === null || typeof response.body === "object").toBe(true);
    });

    it("POST /rides/:rideId/respond", async () => {
        const response = await request(app)
            .post("/rides/ride_001/respond")
            .send({ riding: true });

        expect([200, 204]).toContain(response.status);
    });

    it("POST /rides/:rideId/join", async () => {
        const response = await request(app)
            .post("/rides/ride_002/join")
            .send({});

        expect([200, 204, 409]).toContain(response.status);
        if (response.status === 409) {
            expect(typeof response.body.error).toBe("string");
        }
    });

    it("POST /rides", async () => {
        const response = await request(app)
            .post("/rides")
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
        const response = await request(app).get("/me/rides/rider");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("driverName");
        }
    });

    it("GET /me/rides/driver", async () => {
        const response = await request(app).get("/me/rides/driver");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("passengersCount");
        }
    });

    it("DELETE /rides/:rideId", async () => {
        const create = await request(app)
            .post("/rides")
            .send({
                from: "Ikeja",
                to: "Lekki",
                time: "6:30 AM",
                seats: 2,
                price: 1800,
                repeatDays: ["Mon", "Wed", "Fri"],
            });

        expect(create.status).toBe(201);

        const response = await request(app).delete(`/rides/${create.body.id}`);
        expect(response.status).toBe(204);
    });

    it("DELETE /me/rides/rider/:bookingId", async () => {
        const response = await request(app).delete("/me/rides/rider/booking_001");

        expect(response.status).toBe(204);
    });
});
