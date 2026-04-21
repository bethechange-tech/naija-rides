import type { components, paths } from "../openapi-types";
import { OpenApiMockFactory } from "./openapi-mock.js";

export type LagosLocation = {
  id: string;
  name: string;
  aliases: string[];
  description: string;
};

export const LAGOS_LOCATIONS: LagosLocation[] = [
  { id: "ajah", name: "Ajah", aliases: ["Ajah Junction", "Abraham Adesanya"], description: "Residential hub at the end of Lekki-Epe Expressway, popular for its large market and bus terminus." },
  { id: "badagry", name: "Badagry", aliases: ["Badagry Town"], description: "Historic coastal town on the Lagos-Benin border, known for its slave heritage museums and beaches." },
  { id: "berger", name: "Berger", aliases: ["Ojodu Berger", "Berger Bus Stop"], description: "Major interchange on the Lagos-Ibadan Expressway, one of the busiest bus stops for intercity travel." },
  { id: "cms", name: "CMS", aliases: ["Church Mission Street", "Lagos CMS", "Marina"], description: "Commercial heart of Lagos Island along the marina waterfront, named after Church Mission Society." },
  { id: "festac", name: "Festac", aliases: ["Festac Town", "2nd Avenue"], description: "Planned estate built for the 1977 FESTAC festival, with wide streets and a grid layout." },
  { id: "gbagada", name: "Gbagada", aliases: ["Gbagada Phase 1", "Gbagada Phase 2"], description: "Middle-class residential area with good road access to the mainland and island." },
  { id: "ikeja", name: "Ikeja", aliases: ["Ikeja CBD", "Computer Village", "Allen Avenue"], description: "Capital of Lagos State and major commercial district, home to the airport and Computer Village tech market." },
  { id: "ikorodu", name: "Ikorodu", aliases: ["Ikorodu Town", "Owutu"], description: "Fast-growing satellite town in northern Lagos, connected to the mainland by ferry and road." },
  { id: "ikoyi", name: "Ikoyi", aliases: ["Old Ikoyi", "Parkview", "Bourdillon"], description: "Upscale residential island neighbourhood known for embassies, high-end homes, and waterfront estates." },
  { id: "isale_eko", name: "Isale Eko", aliases: ["Lagos Island Central", "Campos"], description: "The original Lagos settlement, densely populated historic core of Lagos Island." },
  { id: "ketu", name: "Ketu", aliases: ["Alapere", "Mile 12"], description: "Northern mainland area adjacent to Mile 12 market, one of West Africa's largest produce markets." },
  { id: "lagos_island", name: "Lagos Island", aliases: ["Island", "Eko"], description: "The original commercial island of Lagos, containing the CBD, markets, and financial institutions." },
  { id: "lekki", name: "Lekki", aliases: ["Lekki Phase 1", "Lekki Phase 2", "Lekki-Epe Expressway"], description: "Rapidly developing peninsula east of VI with residential estates, malls, and the Lekki Free Trade Zone." },
  { id: "magodo", name: "Magodo", aliases: ["Magodo Phase 1", "Magodo Phase 2"], description: "Quiet residential estate in Kosofe known for its orderly layout and family neighbourhoods." },
  { id: "maryland", name: "Maryland", aliases: ["Maryland Mall", "Mobolaji Bank Anthony Way"], description: "Central mainland district connecting Ikeja and Ikorodu Road, anchored by Maryland Mall." },
  { id: "mile2", name: "Mile 2", aliases: ["Mile Two", "Ojo Road"], description: "Major transit hub on the Lagos-Badagry Expressway serving Festac, Apapa, and Ojo commuters." },
  { id: "ojota", name: "Ojota", aliases: ["Ojota Bus Stop", "New Garage"], description: "Busy interchange at the northern edge of the Lagos-Ibadan Expressway junction." },
  { id: "ojuelegba", name: "Ojuelegba", aliases: ["Tejuosho", "Western Avenue"], description: "Central mainland junction connecting Surulere, Yaba, and Lagos Island routes." },
  { id: "oshodi", name: "Oshodi", aliases: ["Oshodi Market", "Oshodi Interchange"], description: "One of Lagos's most essential transport interchanges, linking all mainland axes." },
  { id: "surulere", name: "Surulere", aliases: ["Aguda", "Ojuelegba", "National Stadium"], description: "Dense residential and commercial area home to the National Stadium and Tejuosho market." },
  { id: "tbs", name: "TBS", aliases: ["Tafawa Balewa Square", "Race Course", "Lagos Island"], description: "Historic Lagos Island square and events venue, former colonial race course near the marina." },
  { id: "vi", name: "Victoria Island", aliases: ["VI", "Victoria Island", "Eti-Osa"], description: "Premier business and nightlife district in Lagos, home to corporate headquarters and upscale restaurants." },
  { id: "yaba", name: "Yaba", aliases: ["Sabo", "Yaba Tech", "Herbert Macaulay Way"], description: "Lagos tech hub and university district, home to UNILAG, YabaCon, and a vibrant startup scene." },
  { id: "apapa", name: "Apapa", aliases: ["Apapa Wharf", "Creek Road"], description: "Industrial port area managing most of Nigeria's sea freight, known for severe traffic congestion." },
  { id: "shomolu", name: "Shomolu", aliases: ["Somolu", "Bariga"], description: "Working-class mainland area known for its printing trade and proximity to Bariga." },
  { id: "mushin", name: "Mushin", aliases: ["Idi-Oro", "Mushin Market"], description: "Dense, vibrant mainland neighbourhood, a major commercial and transport corridor." },
  { id: "agege", name: "Agege", aliases: ["Agege Stadium", "Dopemu"], description: "Northern mainland area known for its bakeries, stadium, and busy Dopemu interchange." },
  { id: "anthony", name: "Anthony Village", aliases: ["Anthony", "Bank Anthony"], description: "Residential suburb between Maryland and Palmgrove, named after Anthony Enahoro." },
  { id: "onikan", name: "Onikan", aliases: ["Onikan Stadium", "Lagos Island South"], description: "Quiet southern part of Lagos Island with the national museum, stadium, and old residential streets." },
];

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
  ) { }

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

    const code = process.env.NODE_ENV === "test"
      ? "1234"
      : Math.floor(1000 + Math.random() * 9000).toString();
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

    const matchesLocation = (rideLocation: string, query: string): boolean => {
      if (rideLocation.toLowerCase().includes(query)) return true;
      const loc = LAGOS_LOCATIONS.find((l) => l.name.toLowerCase() === rideLocation.toLowerCase());
      return loc?.aliases.some((alias) => alias.toLowerCase().includes(query)) ?? false;
    };

    return [...this.repo.rides.values()]
      .filter((ride) => ride.status === "active")
      .map((ride) => this.toRideDto(ride))
      .filter(
        (ride) => matchesLocation(ride.from, fromNorm) && matchesLocation(ride.to, toNorm),
      );
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
      from: "Yaba",                 // aliases: Sabo, Yaba Tech, Herbert Macaulay Way
      to: "Victoria Island",        // aliases: VI, Eti-Osa
      time: "7:30 AM",
      price: 2500,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }),
    seedRide("driver_amaka", {
      id: "ride_002",
      from: "Yaba",                 // aliases: Sabo, Yaba Tech, Herbert Macaulay Way
      to: "Victoria Island",        // aliases: VI, Eti-Osa
      time: "8:15 AM",
      price: 2200,
      seatsTotal: 3,
      status: "completed",
      repeatDays: ["Mon", "Wed", "Fri"],
    }),
    seedRide("driver_seyi", {
      id: "ride_003",
      from: "Lekki",                // aliases: Lekki Phase 1, Lekki Phase 2, Lekki-Epe Expressway
      to: "Yaba",                   // aliases: Sabo, Yaba Tech, Herbert Macaulay Way
      time: "6:45 PM",
      price: 3000,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Tue", "Thu"],
    }),
    seedRide("driver_tunde", {
      id: "ride_004",
      from: "Ikeja",                // aliases: Ikeja CBD, Computer Village, Allen Avenue
      to: "Victoria Island",        // aliases: VI, Eti-Osa
      time: "7:00 AM",
      price: 3500,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }),
    seedRide("driver_amaka", {
      id: "ride_005",
      from: "Surulere",             // aliases: Aguda, Ojuelegba, National Stadium
      to: "Lagos Island",           // aliases: Island, Eko
      time: "8:00 AM",
      price: 1800,
      seatsTotal: 3,
      status: "active",
      repeatDays: ["Mon", "Wed", "Fri"],
    }),
    seedRide("driver_seyi", {
      id: "ride_006",
      from: "Ajah",                 // aliases: Ajah Junction, Abraham Adesanya
      to: "Lekki",                  // aliases: Lekki Phase 1, Lekki Phase 2, Lekki-Epe Expressway
      time: "7:45 AM",
      price: 1500,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }),
    seedRide("driver_tunde", {
      id: "ride_007",
      from: "Gbagada",              // aliases: Gbagada Phase 1, Gbagada Phase 2
      to: "Ikeja",                  // aliases: Ikeja CBD, Computer Village, Allen Avenue
      time: "6:30 AM",
      price: 1200,
      seatsTotal: 3,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }),
    seedRide("driver_amaka", {
      id: "ride_008",
      from: "Ikorodu",              // aliases: Ikorodu Town, Owutu
      to: "Ojota",                  // aliases: Ojota Bus Stop, New Garage
      time: "6:00 AM",
      price: 2000,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Wed", "Fri"],
    }),
    seedRide("driver_seyi", {
      id: "ride_009",
      from: "Maryland",             // aliases: Maryland Mall, Mobolaji Bank Anthony Way
      to: "CMS",                    // aliases: Church Mission Street, Lagos CMS, Marina
      time: "7:15 AM",
      price: 2800,
      seatsTotal: 2,
      status: "active",
      repeatDays: ["Tue", "Thu"],
    }),
    seedRide("driver_tunde", {
      id: "ride_010",
      from: "Oshodi",               // aliases: Oshodi Market, Oshodi Interchange
      to: "Mile 2",                 // aliases: Mile Two, Ojo Road
      time: "8:30 AM",
      price: 1000,
      seatsTotal: 4,
      status: "active",
      repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
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

export const createNaijaRidesServiceForUser = (userId: string) =>
  new NaijaRidesService(naijaRidesRepository, userId);

export const resolveUserIdByToken = (token: string) =>
  naijaRidesRepository.tokensToUserId.get(token);
