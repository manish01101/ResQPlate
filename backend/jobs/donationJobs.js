const cron = require("node-cron");
const Donation = require("../models/donation");

const startCronJobs = () => {
  // Auto-expire donations every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await Donation.updateMany(
        { status: "available", expiry_datetime: { $lt: new Date() } },
        { $set: { status: "expired", expiredAt: new Date() } },
      );

      if (result.modifiedCount > 0) {
        console.log(`[CRON] Auto-expired ${result.modifiedCount} donation(s)`);
      }
    } catch (error) {
      console.error("[CRON ERROR] Failed to expire donations:", error.message);
    }
  });
};

module.exports = startCronJobs;
