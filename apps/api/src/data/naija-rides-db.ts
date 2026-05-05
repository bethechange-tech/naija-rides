import { Prisma, db, genId } from "@repo/db";
import type { components, paths } from "../openapi-types";
import { rideEventPublisher, type RideEventPublisher } from "../events/publisher/index.js";
import { recordJoinConflict } from "../observability/metrics.js";
import { LAGOS_LOCATIONS } from "./locations.js";

type DbClient = NonNullable<typeof db>;

type RideStatus = "active" | "cancelled" | "completed";
type RepeatDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

type RideDto = NonNullable<paths["/rides/search"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type TodayRideResponse = NonNullable<paths["/rides/today"]["get"]["responses"]["200"]["content"]>["application/json"];
type RespondToRideResponse = NonNullable<paths["/rides/{rideId}/respond"]["post"]["responses"]["200"]["content"]>["application/json"];
type CreateRideRequest = NonNullable<paths["/rides"]["post"]["requestBody"]>["content"]["application/json"];
type RiderBookingItem = NonNullable<paths["/me/rides/rider"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type DriverRideItem = NonNullable<paths["/me/rides/driver"]["get"]["responses"]["200"]["content"]>["application/json"][number];
type MeUpdateResponse = components["schemas"]["MeUpdateResponse"];

type SeedUser = {
  id: string;
  username: string;
  phone: string;
  name: string;
  company?: string;
};

type SeedRide = {
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

type SeedRideBooking = {
  id: string;
  rideId: string;
  riderUserId: string;
  cancelledAt?: string;
};

type SeedRideResponse = {
  userId: string;
  rideId: string;
  date: string;
  riding: boolean;
};

const NAJIA_RIDES_USERNAME_PREFIX = "nr_";
export const CURRENT_USER_ID = "user_me";

const seedUsers: SeedUser[] = [
  { id: CURRENT_USER_ID, username: "nr_rasul", phone: "+2348000000000", name: "Rasul" },
  { id: "driver_tunde", username: "nr_tunde", phone: "+2348000000001", name: "Tunde A.", company: "TechShuttle" },
  { id: "driver_amaka", username: "nr_amaka", phone: "+2348000000002", name: "Amaka O." },
  { id: "driver_seyi", username: "nr_seyi", phone: "+2348000000003", name: "Seyi K.", company: "MoveNaija" },
  { id: "rider_b", username: "nr_bola", phone: "+2348000000004", name: "Bola" },
  { id: "rider_c", username: "nr_chioma", phone: "+2348000000005", name: "Chioma" },
  { id: "rider_d", username: "nr_dayo", phone: "+2348000000006", name: "Dayo" },
];

const seedRides: SeedRide[] = [
  { id: "ride_001", driverUserId: "driver_tunde", from: "Yaba", to: "Victoria Island", time: "7:30 AM", price: 2500, seatsTotal: 4, status: "active", repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "ride_002", driverUserId: "driver_amaka", from: "Yaba", to: "Victoria Island", time: "8:15 AM", price: 2200, seatsTotal: 3, status: "completed", repeatDays: ["Mon", "Wed", "Fri"] },
  { id: "ride_003", driverUserId: "driver_seyi", from: "Lekki", to: "Yaba", time: "6:45 PM", price: 3000, seatsTotal: 4, status: "active", repeatDays: ["Tue", "Thu"] },
  { id: "ride_004", driverUserId: "driver_tunde", from: "Ikeja", to: "Victoria Island", time: "7:00 AM", price: 3500, seatsTotal: 4, status: "active", repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "ride_005", driverUserId: "driver_amaka", from: "Surulere", to: "Lagos Island", time: "8:00 AM", price: 1800, seatsTotal: 3, status: "active", repeatDays: ["Mon", "Wed", "Fri"] },
  { id: "ride_006", driverUserId: "driver_seyi", from: "Ajah", to: "Lekki", time: "7:45 AM", price: 1500, seatsTotal: 4, status: "active", repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "ride_007", driverUserId: "driver_tunde", from: "Gbagada", to: "Ikeja", time: "6:30 AM", price: 1200, seatsTotal: 3, status: "active", repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "ride_008", driverUserId: "driver_amaka", from: "Ikorodu", to: "Ojota", time: "6:00 AM", price: 2000, seatsTotal: 4, status: "active", repeatDays: ["Mon", "Wed", "Fri"] },
  { id: "ride_009", driverUserId: "driver_seyi", from: "Maryland", to: "CMS", time: "7:15 AM", price: 2800, seatsTotal: 2, status: "active", repeatDays: ["Tue", "Thu"] },
  { id: "ride_010", driverUserId: "driver_tunde", from: "Oshodi", to: "Mile 2", time: "8:30 AM", price: 1000, seatsTotal: 4, status: "active", repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
];

const seedRideBookings: SeedRideBooking[] = [
  { id: "booking_001", rideId: "ride_001", riderUserId: CURRENT_USER_ID },
  { id: "booking_002", rideId: "ride_003", riderUserId: CURRENT_USER_ID },
  { id: "booking_003", rideId: "ride_001", riderUserId: "rider_b" },
  { id: "booking_004", rideId: "ride_002", riderUserId: "rider_b" },
  { id: "booking_005", rideId: "ride_002", riderUserId: "rider_c" },
  { id: "booking_006", rideId: "ride_002", riderUserId: "rider_d" },
];

const seedRideResponses: SeedRideResponse[] = [
  { userId: CURRENT_USER_ID, rideId: "ride_001", date: "2026-01-01", riding: true },
];

const sanitizeUsername = (raw: string) => `${NAJIA_RIDES_USERNAME_PREFIX}${raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`.slice(0, 32);

const buildUsernameFromPhone = (phone: string) => sanitizeUsername(phone);

const matchesLocation = (rideLocation: string, query: string): boolean => {
  if (rideLocation.toLowerCase().includes(query)) return true;
  const loc = LAGOS_LOCATIONS.find((item) => item.name.toLowerCase() === rideLocation.toLowerCase());
  return loc?.aliases.some((alias) => alias.toLowerCase().includes(query)) ?? false;
};

type RideRecord = {
  id: string;
  from: string;
  to: string;
  time: string;
  price: number;
  seatsTotal: number;
  status: RideStatus;
  repeatDays: RepeatDay[];
  driver: {
    name: string;
    company: string | null;
  };
  rideBookings: Array<unknown>;
};

export class NaijaRidesService {
  private readonly weekdayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

  constructor(
    private readonly currentUserId: string,
    private readonly database: DbClient = db as DbClient,
    private readonly eventPublisher: RideEventPublisher = rideEventPublisher,
  ) {}

  async requestOtpForPhone(phone: string) {
    const code = process.env.NODE_ENV === "test"
      ? "1234"
      : Math.floor(1000 + Math.random() * 9000).toString();

    await this.database.$transaction(async (tx) => {
      // Upsert user atomically to prevent a P2002 crash when concurrent
      // requests for the same phone number race to create the user row.
      const user = await tx.user.upsert({
        where: { phone },
        update: {},
        create: {
          id: genId(),
          username: buildUsernameFromPhone(phone),
          phone,
          name: "",
        },
        select: { id: true },
      });

      await tx.otpCode.upsert({
        where: { phone },
        update: { code, userId: user.id, expiresAt: new Date(Date.now() + 10 * 60_000) },
        create: { phone, code, userId: user.id, expiresAt: new Date(Date.now() + 10 * 60_000) },
      });
    });

    console.log(`[otp] OTP for ${phone}: ${code}`);
  }

  async verifyOtpForPhone(phone: string, code: string): Promise<boolean> {
    const stored = await this.database.otpCode.findUnique({ where: { phone } });
    if (!stored || stored.code !== code || stored.expiresAt < new Date()) {
      return false;
    }

    await this.database.otpCode.delete({ where: { phone } });
    return true;
  }

  async issueTokenForPhone(phone: string): Promise<string> {
    const user = await this.database.user.findUnique({ where: { phone }, select: { id: true } });
    if (!user) {
      return "";
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
    await this.database.authToken.create({ data: { token, userId: user.id } });
    return token;
  }

  async updateCurrentUserProfile(name: string, company?: string): Promise<MeUpdateResponse> {
    const existing = await this.database.user.findUnique({ where: { id: this.currentUserId }, select: { phone: true } });

    await this.database.user.upsert({
      where: { id: this.currentUserId },
      update: { name, company },
      create: {
        id: this.currentUserId,
        username: sanitizeUsername(this.currentUserId),
        phone: existing?.phone,
        name,
        company,
      },
    });

    return { name, company };
  }

  async searchActiveRides(from: string, to: string): Promise<RideDto[]> {
    const fromNorm = from.trim().toLowerCase();
    const toNorm = to.trim().toLowerCase();

    const rides = await this.database.ride.findMany({
      where: { status: "active" },
      include: {
        driver: { select: { name: true, company: true } },
        rideBookings: { where: { cancelledAt: null }, select: { id: true } },
      },
    });

    return rides
      .map((ride) => this.toRideDto(ride))
      .filter((ride) => matchesLocation(ride.from, fromNorm) && matchesLocation(ride.to, toNorm));
  }

  async getTodayRideForCurrentUser(): Promise<TodayRideResponse> {
    const todayLabel = this.weekdayMap[new Date().getDay()];
    if (todayLabel === "Sun" || todayLabel === "Sat") {
      return null;
    }

    const bookings = await this.database.rideBooking.findMany({
      where: { riderUserId: this.currentUserId, cancelledAt: null },
      select: { rideId: true },
    });

    if (bookings.length === 0) {
      return null;
    }

    const rides = await this.database.ride.findMany({
      where: {
        id: { in: bookings.map((booking) => booking.rideId) },
        status: "active",
        repeatDays: { has: todayLabel },
      },
      include: {
        driver: { select: { name: true, company: true } },
        rideBookings: { where: { cancelledAt: null }, select: { id: true } },
      },
    });

    const candidate = rides
      .sort((left, right) => this.parseDisplayTimeToMinutes(left.time) - this.parseDisplayTimeToMinutes(right.time))[0];

    return candidate ? this.toRideDto(candidate) : null;
  }

  async recordRideResponse(rideId: string, riding: boolean): Promise<RespondToRideResponse> {
    const date = new Date().toISOString().slice(0, 10);
    await this.database.rideResponse.upsert({
      where: { userId_rideId_date: { userId: this.currentUserId, rideId, date } },
      update: { riding },
      create: { userId: this.currentUserId, rideId, date, riding },
    });

    return { rideId, riding, date };
  }

  async joinRide(rideId: string): Promise<{ ok: true; ride: RideDto } | { ok: false; code: 404 | 409; error: string }> {
    try {
      const result = await this.database.$transaction(async (tx) => {
        // Lock ride row so concurrent joins serialize against seat checks.
        const lockedRide = await tx.$queryRaw<Array<{ id: string; seatsTotal: number }>>`
          SELECT id, seats_total as "seatsTotal"
          FROM rides
          WHERE id = ${rideId}
          FOR UPDATE
        `;

        if (lockedRide.length === 0) {
          return { ok: false as const, code: 404 as const, error: "Ride not found" };
        }

        const existingBooking = await tx.rideBooking.findFirst({
          where: { rideId, riderUserId: this.currentUserId },
          select: { id: true, cancelledAt: true },
        });

        if (existingBooking && !existingBooking.cancelledAt) {
          recordJoinConflict("already_joined");
          return { ok: false as const, code: 409 as const, error: "You already joined this ride" };
        }

        const seatsTaken = await tx.rideBooking.count({
          where: { rideId, cancelledAt: null },
        });

        if (seatsTaken >= lockedRide[0].seatsTotal) {
          recordJoinConflict("ride_full");
          return { ok: false as const, code: 409 as const, error: "Ride is full" };
        }

        if (existingBooking && existingBooking.cancelledAt) {
          await tx.rideBooking.update({
            where: { id: existingBooking.id },
            data: { cancelledAt: null },
          });
        } else {
          await tx.rideBooking.create({
            data: { id: genId(), rideId, riderUserId: this.currentUserId },
          });
        }

        const refreshedRide = await tx.ride.findUnique({
          where: { id: rideId },
          include: {
            driver: { select: { name: true, company: true } },
            rideBookings: { where: { cancelledAt: null }, select: { id: true } },
          },
        });

        return { ok: true as const, ride: this.toRideDto(refreshedRide as RideRecord) };
      });

      if (!result.ok) {
        return result;
      }

      await this.eventPublisher.publish({
        eventName: "ride.joined",
        rideId,
        actorUserId: this.currentUserId,
        occurredAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        recordJoinConflict("already_joined");
        return { ok: false, code: 409, error: "You already joined this ride" };
      }
      throw error;
    }
  }

  async createRide(payload: CreateRideRequest): Promise<RideDto> {
    const ride = await this.database.ride.create({
      data: {
        id: genId(),
        driverUserId: this.currentUserId,
        from: payload.from.trim(),
        to: payload.to.trim(),
        time: payload.time,
        price: payload.price,
        seatsTotal: payload.seats,
        status: "active",
        repeatDays: payload.repeatDays,
      },
      include: {
        driver: { select: { name: true, company: true } },
        rideBookings: { where: { cancelledAt: null }, select: { id: true } },
      },
    });

    await this.eventPublisher.publish({
      eventName: "ride.created",
      rideId: ride.id,
      actorUserId: this.currentUserId,
      occurredAt: new Date().toISOString(),
      metadata: {
        seatsTotal: ride.seatsTotal,
        price: ride.price,
      },
    });

    return this.toRideDto(ride);
  }

  async getRiderBookingsForCurrentUser(): Promise<RiderBookingItem[]> {
    const bookings = await this.database.rideBooking.findMany({
      where: { riderUserId: this.currentUserId, cancelledAt: null },
      include: {
        ride: {
          include: {
            driver: { select: { name: true } },
          },
        },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      from: booking.ride.from,
      to: booking.ride.to,
      time: booking.ride.time,
      driverName: booking.ride.driver.name,
      status: booking.ride.status,
    }));
  }

  async getDriverRidesForCurrentUser(): Promise<DriverRideItem[]> {
    const rides = await this.database.ride.findMany({
      where: { driverUserId: this.currentUserId },
      include: {
        rideBookings: { where: { cancelledAt: null }, select: { id: true } },
      },
    });

    return rides.map((ride) => ({
      id: ride.id,
      from: ride.from,
      to: ride.to,
      time: ride.time,
      passengersCount: ride.rideBookings.length,
      status: ride.status,
    }));
  }

  async cancelRide(rideId: string): Promise<{ ok: true } | { ok: false; code: 403 | 404; error: string }> {
    const cancelledAt = new Date();

    const result = await this.database.$transaction(async (tx) => {
      // Ownership check inside the transaction so it can never be bypassed by
      // a concurrent update between the check and the writes.
      const ride = await tx.ride.findUnique({ where: { id: rideId }, select: { driverUserId: true } });
      if (!ride) {
        return { ok: false as const, code: 404 as const, error: "Ride not found" };
      }
      if (ride.driverUserId !== this.currentUserId) {
        return { ok: false as const, code: 403 as const, error: "Only the driver can cancel this ride" };
      }

      await tx.ride.update({ where: { id: rideId }, data: { status: "cancelled" } });
      await tx.rideBooking.updateMany({ where: { rideId, cancelledAt: null }, data: { cancelledAt } });

      return { ok: true as const };
    });

    if (!result.ok) {
      return result;
    }

    await this.eventPublisher.publish({
      eventName: "ride.cancelled",
      rideId,
      actorUserId: this.currentUserId,
      occurredAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  async cancelBooking(bookingId: string): Promise<{ ok: true } | { ok: false; code: 403 | 404; error: string }> {
    const result = await this.database.$transaction(async (tx) => {
      // Auth check + update in one transaction so concurrent calls cannot
      // both pass the check and emit duplicate booking.cancelled events.
      const booking = await tx.rideBooking.findUnique({
        where: { id: bookingId },
        select: { riderUserId: true, rideId: true, cancelledAt: true },
      });

      if (!booking) {
        return { ok: false as const, code: 404 as const, error: "Booking not found" };
      }
      if (booking.riderUserId !== this.currentUserId) {
        return { ok: false as const, code: 403 as const, error: "You can only cancel your own bookings" };
      }
      if (booking.cancelledAt !== null) {
        // Already cancelled — treat as success to be idempotent, but skip publish.
        return { ok: true as const, rideId: booking.rideId, alreadyCancelled: true };
      }

      await tx.rideBooking.update({ where: { id: bookingId }, data: { cancelledAt: new Date() } });

      return { ok: true as const, rideId: booking.rideId, alreadyCancelled: false };
    });

    if (!result.ok) {
      return result;
    }

    if (!result.alreadyCancelled) {
      await this.eventPublisher.publish({
        eventName: "booking.cancelled",
        rideId: result.rideId,
        actorUserId: this.currentUserId,
        occurredAt: new Date().toISOString(),
        metadata: { bookingId },
      });
    }

    return { ok: true };
  }

  private toRideDto(ride: RideRecord): RideDto {
    return {
      id: ride.id,
      from: ride.from,
      to: ride.to,
      time: ride.time,
      price: ride.price,
      seatsTotal: ride.seatsTotal,
      seatsTaken: ride.rideBookings.length,
      driverName: ride.driver.name,
      driverCompany: ride.driver.company ?? undefined,
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
}

export const seedNaijaRidesData = async () => {
  await db.$transaction(async (tx) => {
    await tx.user.createMany({
      data: seedUsers.map((user) => ({
        id: user.id,
        username: user.username,
        phone: user.phone,
        name: user.name,
        company: user.company,
      })),
      skipDuplicates: true,
    });

    await tx.ride.createMany({
      data: seedRides.map((ride) => ({
        id: ride.id,
        driverUserId: ride.driverUserId,
        from: ride.from,
        to: ride.to,
        time: ride.time,
        price: ride.price,
        seatsTotal: ride.seatsTotal,
        status: ride.status,
        repeatDays: ride.repeatDays,
      })),
      skipDuplicates: true,
    });

    await tx.rideBooking.createMany({
      data: seedRideBookings.map((booking) => ({
        id: booking.id,
        rideId: booking.rideId,
        riderUserId: booking.riderUserId,
        cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
      })),
      skipDuplicates: true,
    });

    await tx.rideResponse.createMany({
      data: seedRideResponses,
      skipDuplicates: true,
    });
  });
};

export const resetNaijaRidesData = async () => {
  await db.$transaction([
    db.authToken.deleteMany(),
    db.otpCode.deleteMany(),
    db.rideResponse.deleteMany(),
    db.rideBooking.deleteMany(),
    db.ride.deleteMany(),
    db.user.deleteMany({ where: { username: { startsWith: NAJIA_RIDES_USERNAME_PREFIX } } }),
  ]);

  await seedNaijaRidesData();
};

export const ensureNaijaRidesSeeded = async () => {
  const rideCount = await db.ride.count();
  if (rideCount > 0) {
    return;
  }

  await seedNaijaRidesData();
};

export const createNaijaRidesServiceForUser = (userId: string) =>
  new NaijaRidesService(userId);

export const naijaRidesService = createNaijaRidesServiceForUser(CURRENT_USER_ID);

export const findUserIdByToken = async (token: string) => {
  const record = await db.authToken.findUnique({ where: { token }, select: { userId: true } });
  return record?.userId;
};
