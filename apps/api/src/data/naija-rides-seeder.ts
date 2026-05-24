import { ensureNaijaRidesSeeded } from "./naija-rides-db.js";

/** Ensures the demo NaijaRides data exists before the API starts. */
export class NaijaRidesSeeder {
  /** Seeds NaijaRides data only when the database is empty. */
  async ensureSeeded() {
    await ensureNaijaRidesSeeded();
  }
}
