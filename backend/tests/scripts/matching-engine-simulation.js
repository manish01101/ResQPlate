// ==========================================
// 1. DYNAMIC DATA GENERATION
// ==========================================
function randomPoint(centerLat, centerLng, radiusKm) {
  // 1 degree is approx 111.32 km
  const radiusInDegrees = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  return {
    lat: centerLat + w * Math.sin(t),
    // Adjust longitude based on latitude projection
    lng: centerLng + (w * Math.cos(t)) / Math.cos((centerLat * Math.PI) / 180),
  };
}

function makeVolunteers(count) {
  const centerLat = 22.5726;
  const centerLng = 88.3639;
  return Array.from({ length: count }, (_, index) => {
    const point = randomPoint(centerLat, centerLng, 20);
    return {
      _id: `vol-${index + 1}`,
      name: `Volunteer ${index + 1}`,
      // True random reliability between 0.15 and 0.95
      reliabilityScore: parseFloat((0.15 + 0.8 * Math.random()).toFixed(3)),
      location: {
        type: "Point",
        coordinates: [point.lng, point.lat],
      },
    };
  });
}

function makeDonationRequest() {
  const centerLat = 22.5726;
  const centerLng = 88.3639;
  const point = randomPoint(centerLat, centerLng, 15);
  return {
    location: {
      type: "Point",
      coordinates: [point.lng, point.lat],
    },
    // Random urgency score (time remaining)
    urgencyScore: parseFloat((0.3 + 0.7 * Math.random()).toFixed(3)),
  };
}

// ==========================================
// 2. CORE ALGORITHMS
// ==========================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ALGORITHM 1: Standard Nearest Neighbour
function nearestNeighbor(volunteers, donation) {
  const [donorLng, donorLat] = donation.location.coordinates;
  const sorted = volunteers
    .map((vol) => {
      const [volLng, volLat] = vol.location.coordinates;
      return {
        vol,
        distanceKm: haversineDistance(donorLat, donorLng, volLat, volLng),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return sorted[0] || null;
}

// ALGORITHM 2: Proposed mod-FA
function modFireflyAlgorithm(donation, volunteers) {
  const [donorLng, donorLat] = donation.location.coordinates;
  const gamma = 0.005; // Light absorption coefficient scaled for km
  const beta0 = 1.0; // Base attractiveness

  const candidates = volunteers.map((vol) => {
    const [volLng, volLat] = vol.location.coordinates;
    const r = haversineDistance(donorLat, donorLng, volLat, volLng);

    // Attractiveness decays with distance squared
    const beta = beta0 * Math.exp(-gamma * Math.pow(r, 2));
    let intensity = donation.urgencyScore * beta;

    // Reliability Penalty: Heavily penalize unreliability
    if (vol.reliabilityScore < 0.6) {
      const penalty = vol.reliabilityScore / 0.6;
      intensity = intensity * penalty;
    }

    // Final Score: 50% Urgency/Distance, 50% Track Record
    const finalScore = intensity * 0.5 + vol.reliabilityScore * 0.5;

    return { vol, distanceKm: r, finalScore };
  });

  // Return the volunteer with the highest evaluated score
  candidates.sort((a, b) => b.finalScore - a.finalScore);
  return candidates[0] || null;
}

// ==========================================
// 3. SIMULATION EXECUTION
// ==========================================
function runSimulation(requests, volunteers) {
  let nearestSuccess = 0;
  let modFaSuccess = 0;

  for (const request of requests) {
    const nearest = nearestNeighbor(volunteers, request);
    const modFa = modFireflyAlgorithm(request, volunteers);

    // GENUINE RANDOM PROBABILITY TEST:
    // If Math.random() rolls UNDER their reliability score, they successfully show up.
    // E.g., A score of 0.8 means they have an 80% chance of success.

    if (nearest) {
      // Simulate real-world attempt for Nearest Neighbour
      const attemptSucceeds = Math.random() <= nearest.vol.reliabilityScore;
      if (attemptSucceeds) nearestSuccess++;
    }

    if (modFa) {
      // Simulate real-world attempt for mod-FA
      const attemptSucceeds = Math.random() <= modFa.vol.reliabilityScore;
      if (attemptSucceeds) modFaSuccess++;
    }
  }

  return {
    nearest: nearestSuccess,
    modFa: modFaSuccess,
    total: requests.length,
  };
}

function main() {
  console.log("Generating completely random Geo-Spatial Data...");

  // Dynamically generate 50 new volunteers and 100 new requests
  const volunteers = makeVolunteers(50);
  const requests = Array.from({ length: 100 }, () => makeDonationRequest());

  // Run the simulation based on pure probability
  const result = runSimulation(requests, volunteers);

  // Output formatting
  console.log(
    "\nMatching Engine Simulation (n = 100 dynamically generated requests)",
  );
  console.log(
    "--------------------------------------------------------------------------------------------",
  );
  console.log(
    "Method                          | Total Requests | Successful Pickups | Failed / Expired | Success Rate",
  );
  console.log(
    "--------------------------------------------------------------------------------------------",
  );
  console.log(
    `Standard Nearest Neighbour      | 100            | ${result.nearest.toString().padEnd(18)} | ${(result.total - result.nearest).toString().padEnd(16)} | ${((result.nearest / result.total) * 100).toFixed(1)}%`,
  );
  console.log(
    `Proposed mod-FA                 | 100            | ${result.modFa.toString().padEnd(18)} | ${(result.total - result.modFa).toString().padEnd(16)} | ${((result.modFa / result.total) * 100).toFixed(1)}%`,
  );
  console.log(
    "--------------------------------------------------------------------------------------------\n",
  );
}

main();
