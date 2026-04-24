import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import type { paths } from "../openapi-types";
import { createNaijaRidesServiceForUser } from "../data/index.js";
import type { RequestWithAuth } from "../types/http.js";

type SearchRidesQuery = paths["/rides/search"]["get"]["parameters"]["query"];
type Ride = NonNullable<paths["/rides/search"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type TodayRideResponse = NonNullable<paths["/rides/today"]["get"]["responses"]["200"]["content"]>["application/json"];
type RespondToRideParams = paths["/rides/{rideId}/respond"]["post"]["parameters"]["path"];
type RespondToRideRequest = NonNullable<paths["/rides/{rideId}/respond"]["post"]["requestBody"]>["content"]["application/json"];
type RespondToRideResponse = NonNullable<paths["/rides/{rideId}/respond"]["post"]["responses"]["200"]["content"]>["application/json"];
type JoinRideParams = paths["/rides/{rideId}/join"]["post"]["parameters"]["path"];
type JoinRideRequest = NonNullable<paths["/rides/{rideId}/join"]["post"]["requestBody"]>["content"]["application/json"];
type CreateRideRequest = NonNullable<paths["/rides"]["post"]["requestBody"]>["content"]["application/json"];
type CreateRideResponse = NonNullable<paths["/rides"]["post"]["responses"]["201"]["content"]>["application/json"];
type MyRiderRidesResponse = NonNullable<paths["/me/rides/rider"]["get"]["responses"]["200"]["content"]>["application/json"];
type MyDriverRidesResponse = NonNullable<paths["/me/rides/driver"]["get"]["responses"]["200"]["content"]>["application/json"];
type CancelRideParams = paths["/rides/{rideId}"]["delete"]["parameters"]["path"];
type CancelBookingParams = paths["/me/rides/rider/{bookingId}"]["delete"]["parameters"]["path"];

const getAuthedService = (req: RequestWithAuth) => {
  const { authUserId: userId } = req;
  if (!userId) {
    return undefined;
  }
  return createNaijaRidesServiceForUser(userId);
};

export const searchRides = async (c: Context<unknown, unknown, SearchRidesQuery>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { from, to } = c.request.query;
  res.json(await service.searchActiveRides(from, to));
};

export const getTodayRide = async (_c: Context, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const todayRide: TodayRideResponse = await service.getTodayRideForCurrentUser();
  res.json(todayRide);
};

export const respondToRide = async (c: Context<RespondToRideRequest, RespondToRideParams>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { rideId } = c.request.params;
  const { riding } = c.request.requestBody;
  const response: RespondToRideResponse = await service.recordRideResponse(rideId, riding);
  res.status(200).json(response);
};

export const joinRide = async (c: Context<JoinRideRequest, JoinRideParams>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { rideId } = c.request.params;
  void c.request.requestBody;

  const result = await service.joinRide(rideId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(200).json(result.ride);
};

export const createRide = async (c: Context<CreateRideRequest>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = c.request.requestBody;
  const from = payload.from.trim();
  const to = payload.to.trim();

  if (!from) {
    res.status(422).json({ error: "from must be non-empty" });
    return;
  }

  if (!to) {
    res.status(422).json({ error: "to must be non-empty" });
    return;
  }

  if (payload.seats <= 0) {
    res.status(422).json({ error: "seats must be greater than 0" });
    return;
  }

  if (payload.price < 0) {
    res.status(422).json({ error: "price must be greater than or equal to 0" });
    return;
  }

  const newRide: CreateRideResponse = await service.createRide(payload);
  res.status(201).json(newRide);
};

export const getMyRiderRides = async (_c: Context, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result: MyRiderRidesResponse = await service.getRiderBookingsForCurrentUser();
  res.json(result);
};

export const getMyDriverRides = async (_c: Context, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result: MyDriverRidesResponse = await service.getDriverRidesForCurrentUser();
  res.json(result);
};

export const cancelRide = async (c: Context<unknown, CancelRideParams>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { rideId } = c.request.params;

  const result = await service.cancelRide(rideId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(204).send();
};

export const cancelBooking = async (c: Context<unknown, CancelBookingParams>, req: RequestWithAuth, res: Response) => {
  const service = getAuthedService(req);
  if (!service) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { bookingId } = c.request.params;

  const result = await service.cancelBooking(bookingId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(204).send();
};
