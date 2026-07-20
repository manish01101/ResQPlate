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

/**
 * Modified Firefly Algorithm (mod-FA) for volunteer allocation.
 *
 * Firefly metaphor:
 *   - Fireflies  = Volunteers/NGOs
 *   - Brightness = Food donation urgency (quantity × expiry urgency)
 *   - Distance   = Haversine geo-distance between donor and volunteer
 *   - Mutation   = Reliability penalty (low-reliability volunteers pushed down)
 *
 * @param {Object}   donation   Donation document (with location + urgencyScore)
 * @param {Array}    volunteers Array of User documents (role: ngo/volunteer)
 * @param {Object}   options
 * @param {number}   options.gamma        Absorption coefficient (default 0.1)
 * @param {number}   options.beta0        Base attractiveness (default 1.0)
 * @param {number}   options.relThreshold Reliability threshold for mutation (default 0.5)
 * @param {number}   options.topK         How many volunteers to notify (default 3)
 * @returns {Array}  Ranked volunteer list with scores
 */
function modFireflyAlgorithm(donation, volunteers, options = {}) {
  const { gamma = 0.1, beta0 = 1.0, relThreshold = 0.5, topK = 3 } = options;

  const [donorLng, donorLat] = donation.location.coordinates;
  const urgency = Number.isFinite(Number(donation.urgencyScore))
    ? Number(donation.urgencyScore)
    : Number(donation.urgency ?? 0.5);

  // Step 1: Calculate distance and base attractiveness for each volunteer
  const scored = volunteers.map((volunteer) => {
    const [volLng, volLat] = volunteer.location.coordinates;

    // Haversine distance (km)
    const r = haversineDistance(donorLat, donorLng, volLat, volLng);

    // Attractiveness: β = β₀ × e^(−γ × r²)
    const beta = beta0 * Math.exp(-gamma * r * r);

    // Light intensity: proportional to food urgency
    const intensity = urgency * beta;

    return {
      volunteer,
      distanceKm: r,
      beta,
      intensity,
      reliabilityScore: volunteer.reliabilityScore || 0.5,
    };
  });

  // Step 2: Apply Reliability Mutation — penalize unreliable volunteers
  const mutated = scored.map((entry) => {
    let effectiveScore = entry.intensity;

    if (entry.reliabilityScore < relThreshold) {
      // Mutation: push effective distance outward proportionally
      const penaltyFactor = entry.reliabilityScore / relThreshold;
      effectiveScore *= penaltyFactor;
    }

    // Final weighted score: combines intensity + reliability bonus
    const finalScore = parseFloat(
      (effectiveScore * 0.6 + entry.reliabilityScore * 0.4).toFixed(4),
    );

    return { ...entry, finalScore };
  });

  // Step 3: Sort descending by finalScore
  mutated.sort((a, b) => b.finalScore - a.finalScore);

  // Step 4: Return top K volunteers with metadata
  return mutated.slice(0, topK).map((entry, rank) => ({
    rank: rank + 1,
    volunteerId: entry.volunteer._id,
    name: entry.volunteer.name,
    distanceKm: entry.distanceKm,
    reliabilityScore: entry.reliabilityScore,
    faScore: entry.finalScore,
  }));
}

module.exports = { haversineDistance, modFireflyAlgorithm };
