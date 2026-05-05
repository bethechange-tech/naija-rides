import { db } from "@repo/db";
import { resetNaijaRidesData } from "./data/index.js";

const main = async () => {
  await resetNaijaRidesData();
  console.log("NaijaRides seed complete.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
