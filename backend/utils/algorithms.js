/**
 * Haversine Formula — great-circle distance between two GPS points.
 * @param {number} lat1  Donor latitude
 * @param {number} lng1  Donor longitude
 * @param {number} lat2  Volunteer latitude
 * @param {number} lng2  Volunteer longitude
 * @returns {number} Distance in kilometres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(3));
}

/** Clamp a value into the [0, 1] range. */
function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

/** True when a coordinate pair is unusable (missing, NaN or the [0,0] default). */
function isValidCoords(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
  const [lng, lat] = coordinates;
  return (
    Number.isFinite(Number(lng)) &&
    Number.isFinite(Number(lat)) &&
    !(Number(lng) === 0 && Number(lat) === 0)
  );
}

/**
 * Parse the leading number out of a free-text quantity ("5 kg", "3 trays").
 * @returns {number} Quantity in kg/units (0 when unparsable).
 */
function parseQuantityKg(quantity) {
  if (typeof quantity !== "string") return 0;
  const match = quantity.match(/\d+(\.\d+)?/);
  if (!match) return 0;
  const value = parseFloat(match[0]);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Surge radius — how far to search for volunteers.
 *
 * Urgent food fans out to a wide area (someone must take it fast),
 * fresh food stays local (high quality, close matches only).
 *
 * @param {number} urgency Food urgency score (0–1)
 * @param {Object} opts { minKm = 5, maxKm = 40 }
 * @returns {number} Search radius in kilometres
 */
function surgeRadiusKm(urgency, { minKm = 5, maxKm = 40 } = {}) {
  const u = clamp01(urgency);
  return parseFloat((minKm + (maxKm - minKm) * u).toFixed(1));
}

/**
 * Modified Firefly Algorithm (mod-FA) for volunteer allocation.
 *
 * Firefly metaphor:
 *   - Fireflies  = Volunteers/NGOs
 *   - Brightness = Food urgency (perishability × time pressure × quantity bonus)
 *   - Distance   = Haversine geo-distance (β = β₀·e^(−γ′·r²))
 *   - Mutation   = Reliability penalty (low-reliability volunteers pushed down)
 *
 * Urgency genuinely affects the outcome:
 *   1. Surge radius: the more urgent the food, the wider the search.
 *   2. γ′ = γ·(1 − 0.8·urgency): urgent food decays attractiveness slower,
 *      so farther volunteers stay competitive.
 *   3. Large quantities (≥ 20) get an urgency boost.
 *
 * @param {Object}   donation   Donation document (location + urgencyScore + quantity)
 * @param {Array}    volunteers Array of User documents (role: ngo/volunteer)
 * @param {Object}   options
 * @param {number}   options.gamma        Base absorption coefficient (default 0.1)
 * @param {number}   options.beta0        Base attractiveness (default 1.0)
 * @param {number}   options.relThreshold Reliability mutation threshold (default 0.5)
 * @param {number}   options.topK         How many volunteers to notify (default 3)
 * @param {number}   options.radiusKm     Explicit search radius (default: surgeRadiusKm)
 * @returns {{ recipients: Array, surgeRadiusKm: number, urgency: number }}
 */
function modFireflyAlgorithm(donation, volunteers, options = {}) {
  const {
    gamma = 0.1,
    beta0 = 1.0,
    relThreshold = 0.5,
    topK = 3,
    radiusKm = null,
  } = options;

  if (!donation || !donation.location || !Array.isArray(volunteers)) {
    return { recipients: [], surgeRadiusKm: 5, urgency: 0.5 };
  }

  const [donorLng, donorLat] = donation.location.coordinates;
  if (!isValidCoords(donation.location.coordinates)) {
    return { recipients: [], surgeRadiusKm: 5, urgency: 0.5 };
  }

  // Base urgency from the virtual getter, then the quantity bonus.
  let urgency = clamp01(donation.urgencyScore ?? donation.urgency ?? 0.5);
  const quantityKg = parseQuantityKg(donation.quantity);
  if (quantityKg >= 20) {
    urgency = Math.min(1, urgency * (1 + Math.min(0.05 * (quantityKg - 20), 0.3)));
  }

  // Urgency-tuned decay: expiring food treats distance more leniently.
  const gammaEff = gamma * (1 - 0.8 * urgency);
  const searchRadiusKm = radiusKm ?? surgeRadiusKm(urgency);

  const scored = [];

  for (const volunteer of volunteers) {
    if (!volunteer?.location || !isValidCoords(volunteer.location.coordinates)) {
      continue; // Skip unusable candidates instead of crashing
    }

    const [volLng, volLat] = volunteer.location.coordinates;
    const r = haversineDistance(donorLat, donorLng, volLat, volLng);

    if (r > searchRadiusKm) continue; // Enforce the surge radius

    // Attractiveness: β = β₀ × e^(−γ′ × r²)
    const beta = beta0 * Math.exp(-gammaEff * r * r);

    // Light intensity: proportional to food urgency
    const intensity = urgency * beta;

    const reliabilityScore = clamp01(volunteer.reliabilityScore ?? 0.5);

    // Reliability mutation — penalize unreliable volunteers below the threshold
    let effectiveScore = intensity;
    if (reliabilityScore < relThreshold) {
      effectiveScore *= Math.max(reliabilityScore / relThreshold, 0.4);
    }

    // Final weighted score: intensity + reliability bonus
    const finalScore = parseFloat(
      (effectiveScore * 0.6 + reliabilityScore * 0.4).toFixed(4),
    );

    if (!Number.isFinite(finalScore)) continue;

    scored.push({
      volunteer,
      distanceKm: r,
      beta,
      intensity,
      reliabilityScore,
      finalScore,
    });
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const recipients = scored.slice(0, topK).map((entry, rank) => ({
    rank: rank + 1,
    volunteerId: entry.volunteer._id,
    name: entry.volunteer.name,
    distanceKm: entry.distanceKm,
    reliabilityScore: entry.reliabilityScore,
    urgencyScore: parseFloat(urgency.toFixed(3)),
    surgeRadiusKm: searchRadiusKm,
    beta: parseFloat(entry.beta.toFixed(4)),
    faScore: entry.finalScore,
  }));

  return { recipients, surgeRadiusKm: searchRadiusKm, urgency };
}

module.exports = {
  haversineDistance,
  modFireflyAlgorithm,
  surgeRadiusKm,
  parseQuantityKg,
};
