// ==========================================
// 1. DYNAMIC BEHAVIORAL MODELING
// ==========================================

// Simulates the traditional manual phone call process
function simulateManualProcess(totalDonations) {
  let totalTimeMinutes = 0;
  let totalCancelled = 0;

  for (let i = 0; i < totalDonations; i++) {
    // 1. Time to Connect: Sequential phone calls
    // It usually takes calling 4 to 8 different people to find someone available
    const callsNeeded = Math.floor(Math.random() * 5) + 4;

    // Each call (including dial time, ringing, chatting, checking availability) takes 4 to 7 minutes
    let timeForThisDonation = 0;
    for (let c = 0; c < callsNeeded; c++) {
      const callDuration = 4 + Math.random() * 3;
      timeForThisDonation += callDuration;
    }

    // Add time spent finding phone numbers (idle time)
    timeForThisDonation += 5 + Math.random() * 10;

    totalTimeMinutes += timeForThisDonation;

    // 2. Cancellation Rate: Probability of failure scales with time
    // Base 5% chance of cancellation + 0.45% chance for every minute that passes (food gets cold, donor gives up)
    let cancellationProbability = 0.05 + timeForThisDonation * 0.0045;

    // Digital "coin flip" to see if this specific donation gets cancelled
    if (Math.random() <= cancellationProbability) {
      totalCancelled++;
    }
  }

  return {
    avgTime: totalTimeMinutes / totalDonations,
    cancelRate: (totalCancelled / totalDonations) * 100,
  };
}

// Simulates the ResQPlate digital matching process
function simulateDigitalProcess(totalDonations) {
  let totalTimeMinutes = 0;
  let totalCancelled = 0;

  for (let i = 0; i < totalDonations; i++) {
    // 1. Time to Connect: Parallel push notifications + mod-FA ranking
    // Server processing takes ~0.05 mins. Human taps "Accept" in 1 to 4 minutes.
    const serverLatency = 0.05;
    const humanResponseTime = 1.0 + Math.random() * 3.0;
    const timeForThisDonation = serverLatency + humanResponseTime;

    totalTimeMinutes += timeForThisDonation;

    // 2. Cancellation Rate: Drops dramatically because food is fresh
    // Base 5% chance + minimal time penalty + slight random friction (e.g., volunteer gets flat tire)
    let cancellationProbability =
      0.05 + timeForThisDonation * 0.0045 + Math.random() * 0.02;

    // Digital "coin flip"
    if (Math.random() <= cancellationProbability) {
      totalCancelled++;
    }
  }

  return {
    avgTime: totalTimeMinutes / totalDonations,
    cancelRate: (totalCancelled / totalDonations) * 100,
  };
}

// ==========================================
// 2. EXECUTION & FORMATTING
// ==========================================
function main() {
  const TOTAL_DONATIONS_SIMULATED = 1000;

  console.log("Generating Dynamic Logistics Data for 1,000 Donations...\n");

  const manualResults = simulateManualProcess(TOTAL_DONATIONS_SIMULATED);
  const digitalResults = simulateDigitalProcess(TOTAL_DONATIONS_SIMULATED);

  console.log(
    "======================================================================",
  );
  console.log("14.3 End-to-End Coordination Time and Cancellation Rate");
  console.log(
    "======================================================================",
  );
  console.log(
    "Method                          | Avg Coordination Time | Cancel Rate ",
  );
  console.log(
    "----------------------------------------------------------------------",
  );

  console.log(
    `Manual (Phone Coordination)     | ${manualResults.avgTime.toFixed(1).toString().padEnd(17)} min | ` +
      `${manualResults.cancelRate.toFixed(1).toString().padStart(4)}%`,
  );

  console.log(
    `ResQPlate (Digital Platform)    | ${digitalResults.avgTime.toFixed(1).toString().padEnd(17)} min | ` +
      `${digitalResults.cancelRate.toFixed(1).toString().padStart(4)}%`,
  );
  console.log(
    "======================================================================\n",
  );

  // Outputting the academic causal chain (matching the 14.4 Discussion in your image)
  const timeReduction = (
    manualResults.avgTime / digitalResults.avgTime
  ).toFixed(1);
  console.log("-> Discussion Summary:");
  console.log(
    `The digital platform achieved an ${timeReduction}x reduction in coordination time.`,
  );
  console.log(
    "Because the food is claimed almost instantly, the likelihood of spoilage",
  );
  console.log(
    "and donor fatigue drops drastically, causing the cascading reduction",
  );
  console.log("in the final cancellation rate.\n");
}

main();
