import type { Context } from "openapi-backend";
import type { Request, Response } from "express";
import type { paths } from "../openapi-types";
import { naijaRidesService } from "../data/index.js";

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

export const searchRides = (c: Context, _req: Request, res: Response) => {
  const { from, to } = c.request.query as SearchRidesQuery;
  res.json(naijaRidesService.searchActiveRides(from, to));
};

export const getTodayRide = (_c: Context, _req: Request, res: Response) => {
  const todayRide: TodayRideResponse = naijaRidesService.getTodayRideForCurrentUser();
  res.json(todayRide);
};

export const respondToRide = (c: Context, _req: Request, res: Response) => {
  const { rideId } = c.request.params as RespondToRideParams;
  const { riding } = c.request.requestBody as RespondToRideRequest;
  const response: RespondToRideResponse = naijaRidesService.recordRideResponse(rideId, riding);
  res.status(200).json(response);
};

export const joinRide = (c: Context, _req: Request, res: Response) => {
  const { rideId } = c.request.params as JoinRideParams;
  void (c.request.requestBody as JoinRideRequest);

  const result = naijaRidesService.joinRide(rideId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(200).json(result.ride);
};

export const createRide = (c: Context, _req: Request, res: Response) => {
  const payload = c.request.requestBody as CreateRideRequest;
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

  const newRide: CreateRideResponse = naijaRidesService.createRide(payload);
  res.status(201).json(newRide);
};

export const getMyRiderRides = (_c: Context, _req: Request, res: Response) => {
  const result: MyRiderRidesResponse = naijaRidesService.getRiderBookingsForCurrentUser();
  res.json(result);
};

export const getMyDriverRides = (_c: Context, _req: Request, res: Response) => {
  const result: MyDriverRidesResponse = naijaRidesService.getDriverRidesForCurrentUser();
  res.json(result);
};

export const cancelRide = (c: Context, _req: Request, res: Response) => {
  const { rideId } = c.request.params as CancelRideParams;

  const result = naijaRidesService.cancelRide(rideId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(204).send();
};

export const cancelBooking = (c: Context, _req: Request, res: Response) => {
  const { bookingId } = c.request.params as CancelBookingParams;

  const result = naijaRidesService.cancelBooking(bookingId);
  if (!result.ok) {
    res.status(result.code).json({ error: result.error });
    return;
  }

  res.status(204).send();
};
