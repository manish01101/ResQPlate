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

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

// ALGORITHM 2: Shipped mod-FA (mirrors backend/utils/algorithms.js)
//   - surge radius: urgent food reaches further
//   - gamma' decays with urgency (urgent food tolerates longer distances)
//   - reliability mutation below the 0.5 threshold
//   - final score: 60% intensity + 40% reliability
function modFireflyAlgorithm(donation, volunteers) {
  const [donorLng, donorLat] = donation.location.coordinates;
  const beta0 = 1.0;
  const relThreshold = 0.5;

  let urgency = clamp01(donation.urgencyScore ?? 0.5);
  const quantityKg =
    typeof donation.quantity === "string"
      ? parseFloat((donation.quantity.match(/\d+(\.\d+)?/) || ["0"])[0]) || 0
      : 0;
  if (quantityKg >= 20) {
    urgency = Math.min(1, urgency * (1 + Math.min(0.05 * (quantityKg - 20), 0.3)));
  }

  const gammaEff = 0.1 * (1 - 0.8 * urgency);
  const surgeRadius = 5 + 35 * urgency;

  const candidates = volunteers
    .map((vol) => {
      if (!vol.location || !Array.isArray(vol.location.coordinates)) return null;
      const [volLng, volLat] = vol.location.coordinates;
      const r = haversineDistance(donorLat, donorLng, volLat, volLng);
      if (r > surgeRadius) return null;

      const beta = beta0 * Math.exp(-gammaEff * r * r);
      let intensity = urgency * beta;

      // Reliability mutation: penalize unreliable volunteers
      const reliability = clamp01(vol.reliabilityScore ?? 0.5);
      if (reliability < relThreshold) {
        intensity *= Math.max(reliability / relThreshold, 0.4);
      }

      const finalScore = intensity * 0.6 + reliability * 0.4;
      return { vol, distanceKm: r, reliabilityScore: reliability, finalScore };
    })
    .filter(Boolean)
    .sort((a, b) => b.finalScore - a.finalScore);

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
