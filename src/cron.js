import cron from "node-cron";
import Medicine from "./models/medicine.js";
import { notifyPharmacyStockOrExpiry } from "./utils/notification.js"; 

// Run every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  try {
    console.log("Checking for expired medicines...");

    const today = new Date();
    const expiredMedicines = await Medicine.find({
      expiryDate: { $lt: today },
    }).populate("pharmacyId");

    for (const medicine of expiredMedicines) {
      await notifyPharmacyStockOrExpiry(medicine);
    }

    console.log(`Checked ${expiredMedicines.length} expired medicines.`);
  } catch (err) {
    console.error("Error in expiry cron job:", err);
  }
});
