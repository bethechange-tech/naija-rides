import type { components, paths } from "../openapi-types";
import { OpenApiMockFactory } from "./openapi-mock.js";

type RideStatus = "active" | "cancelled" | "completed";
type RepeatDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

type RideDto = NonNullable<paths["/rides/search"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type TodayRideResponse = NonNullable<paths["/rides/today"]["get"]["responses"]["200"]["content"]>["application/json"];
type RespondToRideResponse = NonNullable<paths["/rides/{rideId}/respond"]["post"]["responses"]["200"]["content"]>["application/json"];
type CreateRideRequest = NonNullable<paths["/rides"]["post"]["requestBody"]>["content"]["application/json"];
type RiderBookingItem = NonNullable<paths["/me/rides/rider"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type DriverRideItem = NonNullable<paths["/me/rides/driver"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type MeUpdateResponse = components["schemas"]["MeUpdateResponse"];

type UserRow = {
  id: string;
  phone: string;
  name: string;
  company?: string;
};

type RideRow = {
  id: string;
  driverUserId: string;
  from: string;
  to: string;
  time: string;
  price: number;
  seatsTotal: number;
  status: RideStatus;
  repeatDays: RepeatDay[];
};

type RideBookingRow = {
  id: string;
  rideId: string;
  riderUserId: string;
  cancelledAt?: string;
};

type RideResponseRow = {
  userId: string;
  rideId: string;
  date: string;
  riding: boolean;
};

type DbSeedData = {
  users: UserRow[];
  rides: RideRow[];
  rideBookings: RideBookingRow[];
  rideResponses: RideResponseRow[];
};

export interface NaijaRidesRepository {
  users: Map<string, UserRow>;
  usersByPhone: Map<string, string>;
  rides: Map<string, RideRow>;
  rideBookings: Map<string, RideBookingRow>;
  rideResponses: Map<string, RideResponseRow>;
  otpCodesByPhone: Map<string, string>;
  tokensToUserId: Map<string, string>;
  nextRideId(): string;
  nextBookingId(): string;
}

export class MapNaijaRidesRepository implements NaijaRidesRepository {
  users = new Map<string, UserRow>();
  usersByPhone = new Map<string, string>();
  rides = new Map<string, RideRow>();
  rideBookings = new Map<string, RideBookingRow>();
  rideResponses = new Map<string, RideResponseRow>();
  otpCodesByPhone = new Map<string, string>();
  tokensToUserId = new Map<string, string>();

  private rideSequence = 100;
  private bookingSequence = 100;

  nextRideId() {
    this.rideSequence += 1;
    return `ride_${this.rideSequence}`;
  }

  nextBookingId() {
    this.bookingSequence += 1;
    return `booking_${this.bookingSequence}`;
  }
}

export class NaijaRidesService {
  private readonly weekdayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

  constructor(
    private readonly repo: NaijaRidesRepository,
    private readonly currentUserId: string,
  ) {}

  seed(data: DbSeedData) {
    for (const user of data.users) this.upsertUser(user);
    for (const ride of data.rides) this.repo.rides.set(ride.id, ride);
    for (const booking of data.rideBookings) this.repo.rideBookings.set(booking.id, booking);
    for (const response of data.rideResponses) {
      this.repo.rideResponses.set(`${response.userId}:${response.rideId}:${response.date}`, response);
    }
  }

  requestOtpForPhone(phone: string) {
    const userId = this.repo.usersByPhone.get(phone);
    if (!userId) {
      this.upsertUser({ id: `user_${Date.now()}`, phone, name: "" });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.repo.otpCodesByPhone.set(phone, code);
    console.log(`[mock] OTP for ${phone}: ${code}`);
  }

  verifyOtpForPhone(phone: string, code: string): boolean {
    const stored = this.repo.otpCodesByPhone.get(phone);
    if (!stored || stored !== code) return false;
    this.repo.otpCodesByPhone.delete(phone);
    return true;
  }

  issueTokenForPhone(phone: string): string {
    const userId = this.repo.usersByPhone.get(phone);
    if (!userId) return "";

    const token = Buffer.from(`${userId}:${Date.now()}`).toString("base64");
    this.repo.tokensToUserId.set(token, userId);
    return token;
  }

  updateCurrentUserProfile(name: string, company?: string): MeUpdateResponse {
    const current = this.repo.users.get(this.currentUserId);
    if (!current) {
      this.upsertUser({ id: this.currentUserId, phone: "+2348000000000", name, company });
      return { name, company };
    }

    const updated: UserRow = { ...current, name, company };
    this.upsertUser(updated);
    return { name: updated.name, company: updated.company };
  }

  searchActiveRides(from: string, to: string): RideDto[] {
    const fromNorm = from.trim().toLowerCase();
    const toNorm = to.trim().toLowerCase();

    return [...this.repo.rides.values()]
      .filter((ride) => ride.status === "active")
      .map((ride) => this.toRideDto(ride))
      .filter((ride) => ride.from.toLowerCase() === fromNorm && ride.to.toLowerCase() === toNorm);
  }

  getTodayRideForCurrentUser(): TodayRideResponse {
    const todayLabel = this.weekdayMap[new Date().getDay()];
    if (todayLabel === "Sun" || todayLabel === "Sat") return null;

    const bookedRideIds = [...this.repo.rideBookings.values()]
      .filter((booking) => booking.riderUserId === this.currentUserId && !booking.cancelledAt)
      .map((booking) => booking.rideId);

    const candidateRides = [...this.repo.rides.values()]
      .filter((ride) => bookedRideIds.includes(ride.id))
      .filter((ride) => ride.status === "active" && ride.repeatDays.includes(todayLabel))
      .sort((a, b) => this.parseDisplayTimeToMinutes(a.time) - this.parseDisplayTimeToMinutes(b.time));

    if (candidateRides.length === 0) return null;
    return this.toRideDto(candidateRides[0]);
  }

  recordRideResponse(rideId: string, riding: boolean): RespondToRideResponse {
    const date = new Date().toISOString().slice(0, 10);
    const key = `${this.currentUserId}:${rideId}:${date}`;
    this.repo.rideResponses.set(key, { userId: this.currentUserId, rideId, date, riding });
    return { rideId, riding, date };
  }

  joinRide(rideId: string): { ok: true; ride: RideDto } | { ok: false; code: 404 | 409; error: string } {
    const ride = this.repo.rides.get(rideId);
    if (!ride) return { ok: false, code: 404, error: "Ride not found" };

    const hasBooking = [...this.repo.rideBookings.values()].some(
      (booking) => booking.riderUserId === this.currentUserId && booking.rideId === rideId && !booking.cancelledAt,
    );
    if (hasBooking) return { ok: false, code: 409, error: "You already joined this ride" };

    if (this.countSeatsTaken(rideId) >= ride.seatsTotal) {
      return { ok: false, code: 409, error: "Ride is full" };
    }

    const bookingId = this.repo.nextBookingId();
    this.repo.rideBookings.set(bookingId, { id: bookingId, rideId, riderUserId: this.currentUserId });

    return { ok: true, ride: this.toRideDto(ride) };
  }

  createRide(payload: CreateRideRequest): RideDto {
    const id = this.repo.nextRideId();
    const row: RideRow = {
      id,
      driverUserId: this.currentUserId,
      from: payload.from.trim(),
      to: payload.to.trim(),
      time: payload.time,
      price: payload.price,
      seatsTotal: payload.seats,
      status: "active",
      repeatDays: payload.repeatDays,
    };

    this.repo.rides.set(id, row);
    return this.toRideDto(row);
  }

  getRiderBookingsForCurrentUser(): RiderBookingItem[] {
    return [...this.repo.rideBookings.values()]
      .filter((booking) => booking.riderUserId === this.currentUserId && !booking.cancelledAt)
      .map((booking) => {
        const ride = this.repo.rides.get(booking.rideId);
        if (!ride) return null;

        const driver = this.repo.users.get(ride.driverUserId);
        return {
          id: booking.id,
          from: ride.from,
          to: ride.to,
          time: ride.time,
          driverName: driver?.name ?? "Unknown Driver",
          status: ride.status,
        };
      })
      .filter((item): item is RiderBookingItem => item !== null);
  }

  getDriverRidesForCurrentUser(): DriverRideItem[] {
    return [...this.repo.rides.values()]
      .filter((ride) => ride.driverUserId === this.currentUserId)
      .map((ride) => ({
        id: ride.id,
        from: ride.from,
        to: ride.to,
        time: ride.time,
        passengersCount: this.countSeatsTaken(ride.id),
        status: ride.status,
      }));
  }

  cancelRide(rideId: string): { ok: true } | { ok: false; code: 403 | 404; error: string } {
    const ride = this.repo.rides.get(rideId);
    if (!ride) return { ok: false, code: 404, error: "Ride not found" };

    if (ride.driverUserId !== this.currentUserId) {
      return { ok: false, code: 403, error: "Only the driver can cancel this ride" };
    }

    ride.status = "cancelled";
    this.repo.rides.set(ride.id, ride);

    const now = new Date().toISOString();
    for (const booking of this.repo.rideBookings.values()) {
      if (booking.rideId === rideId && !booking.cancelledAt) {
        booking.cancelledAt = now;
        this.repo.rideBookings.set(booking.id, booking);
      }
    }

    return { ok: true };
  }

  cancelBooking(bookingId: string): { ok: true } | { ok: false; code: 403 | 404; error: string } {
    const booking = this.repo.rideBookings.get(bookingId);
    if (!booking) return { ok: false, code: 404, error: "Booking not found" };

    if (booking.riderUserId !== this.currentUserId) {
      return { ok: false, code: 403, error: "You can only cancel your own bookings" };
    }

    booking.cancelledAt = new Date().toISOString();
    this.repo.rideBookings.set(booking.id, booking);

    return { ok: true };
  }

  private upsertUser(row: UserRow) {
    this.repo.users.set(row.id, row);
    this.repo.usersByPhone.set(row.phone, row.id);
  }

  private toRideDto(ride: RideRow): RideDto {
    const driver = this.repo.users.get(ride.driverUserId);
    return {
      id: ride.id,
      from: ride.from,
      to: ride.to,
      time: ride.time,
      price: ride.price,
      seatsTotal: ride.seatsTotal,
      seatsTaken: this.countSeatsTaken(ride.id),
      driverName: driver?.name ?? "Unknown Driver",
      driverCompany: driver?.company,
      status: ride.status,
      repeatDays: ride.repeatDays,
    };
  }

  private parseDisplayTimeToMinutes(time: string): number {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const [, hoursText, minutesText, meridiemText] = match;
    let hours = Number(hoursText) % 12;
    const minutes = Number(minutesText);
    if (meridiemText.toUpperCase() === "PM") hours += 12;

    return hours * 60 + minutes;
  }

  private countSeatsTaken(rideId: string): number {
    let total = 0;
    for (const booking of this.repo.rideBookings.values()) {
      if (booking.rideId === rideId && !booking.cancelledAt) total += 1;
    }
    return total;
  }
}

export const CURRENT_USER_ID = "user_me";

const seedFactory = new OpenApiMockFactory();

const seedRide = (driverUserId: string, overrides: Partial<RideDto>): RideRow => {
  const ride = seedFactory.sampleRide(overrides);
  return {
    id: ride.id,
    driverUserId,
    from: ride.from,
    to: ride.to,
    time: ride.time,
    price: ride.price,
    seatsTotal: ride.seatsTotal,
    status: ride.status,
    repeatDays: ride.repeatDays,
  };
};

const seedData: DbSeedData = {
  users: [
    seedFactory.sampleUserRow({ id: CURRENT_USER_ID, phone: "+2348000000000", name: "Rasul", company: undefined }),
    seedFactory.sampleUserRow({ id: "driver_tunde", phone: "+2348000000001", name: "Tunde A.", company: "TechShuttle" }),
    seedFactory.sampleUserRow({ id: "driver_amaka", phone: "+2348000000002", name: "Amaka O.", company: undefined }),
    seedFactory.sampleUserRow({ id: "driver_seyi", phone: "+2348000000003", name: "Seyi K.", company: "MoveNaija" }),
    seedFactory.sampleUserRow({ id: "rider_b", phone: "+2348000000004", name: "Bola", company: undefined }),
    seedFactory.sampleUserRow({ id: "rider_c", phone: "+2348000000005", name: "Chioma", company: undefined }),
    seedFactory.sampleUserRow({ id: "rider_d", phone: "+2348000000006", name: "Dayo", company: undefined }),
  ],
  rides: [
    seedRide("driver_tunde", {
      id: "ride_001",
      from: "Yaba",
      to: "VI",
      time: "7:30 AM",
      price: 2500,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }),
    seedRide("driver_amaka", {
      id: "ride_002",
      from: "Yaba",
      to: "VI",
      time: "8:15 AM",
      price: 2200,
      seatsTotal: 3,
      status: "completed",
      repeatDays: ["Mon", "Wed", "Fri"],
    }),
    seedRide("driver_seyi", {
      id: "ride_003",
      from: "Lekki",
      to: "Yaba",
      time: "6:45 PM",
      price: 3000,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Tue", "Thu"],
    }),
  ],
  rideBookings: [
    seedFactory.sampleRideBookingRow({ id: "booking_001", rideId: "ride_001", riderUserId: CURRENT_USER_ID }),
    seedFactory.sampleRideBookingRow({ id: "booking_002", rideId: "ride_003", riderUserId: CURRENT_USER_ID }),
    seedFactory.sampleRideBookingRow({ id: "booking_003", rideId: "ride_001", riderUserId: "rider_b" }),
    seedFactory.sampleRideBookingRow({ id: "booking_004", rideId: "ride_002", riderUserId: "rider_b" }),
    seedFactory.sampleRideBookingRow({ id: "booking_005", rideId: "ride_002", riderUserId: "rider_c" }),
    seedFactory.sampleRideBookingRow({ id: "booking_006", rideId: "ride_002", riderUserId: "rider_d" }),
  ],
  rideResponses: [
    seedFactory.sampleRideResponseRow({ userId: CURRENT_USER_ID, rideId: "ride_001", date: "2026-01-01", riding: true }),
  ],
};

export const naijaRidesRepository = new MapNaijaRidesRepository();
export const naijaRidesService = new NaijaRidesService(naijaRidesRepository, CURRENT_USER_ID);
naijaRidesService.seed(seedData);
