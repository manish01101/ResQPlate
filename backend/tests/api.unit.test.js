const {
  haversineDistance,
  modFireflyAlgorithm,
  surgeRadiusKm,
  parseQuantityKg,
} = require("../utils/algorithms");

describe("Core Algorithms Unit Tests", () => {
  describe("haversineDistance (Geo-Spatial Optimization)", () => {
    test("calculates distance correctly between two known coordinates", () => {
      const kolkata = { lat: 22.5726, lng: 88.3639 };
      const delhi = { lat: 28.7041, lng: 77.1025 };

      const distance = haversineDistance(
        kolkata.lat,
        kolkata.lng,
        delhi.lat,
        delhi.lng,
      );

      expect(distance).toBeGreaterThan(1200);
      expect(distance).toBeLessThan(1400);
    });

    test("returns 0 when coordinates are identical", () => {
      const distance = haversineDistance(22.5726, 88.3639, 22.5726, 88.3639);
      expect(distance).toBe(0);
    });
  });

  describe("surgeRadiusKm (urgency-driven search reach)", () => {
    test("fresh food stays local (small radius)", () => {
      expect(surgeRadiusKm(0.1)).toBeLessThanOrEqual(10);
    });

    test("urgent food fans out to the maximum radius", () => {
      expect(surgeRadiusKm(1)).toBe(40);
    });

    test("default urgency lands mid-range", () => {
      expect(surgeRadiusKm(0.5)).toBe(22.5);
    });
  });

  describe("parseQuantityKg", () => {
    test("extracts leading number from free-text quantity", () => {
      expect(parseQuantityKg("5 kg")).toBe(5);
      expect(parseQuantityKg("3 trays")).toBe(3);
      expect(parseQuantityKg("2")).toBe(2);
    });

    test("returns 0 for unparsable input", () => {
      expect(parseQuantityKg("a box")).toBe(0);
      expect(parseQuantityKg(null)).toBe(0);
    });
  });

  describe("modFireflyAlgorithm (Priority Matching Engine)", () => {
    const donation = {
      location: { coordinates: [88.3639, 22.5726] },
      urgencyScore: 1.0,
      quantity: "2",
    };

    test("ranks a highly reliable volunteer over a slightly closer unreliable one", () => {
      const volunteers = [
        {
          _id: "vol-1",
          location: { coordinates: [88.364, 22.5727] },
          reliabilityScore: 0.2,
        },
        {
          _id: "vol-2",
          location: { coordinates: [88.37, 22.58] },
          reliabilityScore: 0.9,
        },
      ];

      const result = modFireflyAlgorithm(donation, volunteers, { topK: 1 });

      expect(result.recipients[0].volunteerId).toBe("vol-2");
    });

    test("applies penalty mutation correctly for scores below 0.5 threshold", () => {
      const volunteers = [
        {
          _id: "vol-1",
          location: { coordinates: [88.364, 22.5727] },
          reliabilityScore: 0.4,
        },
        {
          _id: "vol-2",
          location: { coordinates: [88.364, 22.5727] },
          reliabilityScore: 0.6,
        },
      ];

      const result = modFireflyAlgorithm(donation, volunteers, { topK: 1 });
      expect(result.recipients[0].volunteerId).toBe("vol-2");
    });

    test("skips candidates with missing or [0,0] coordinates instead of crashing", () => {
      const volunteers = [
        {
          _id: "vol-null",
          location: null,
          reliabilityScore: 0.9,
        },
        {
          _id: "vol-zero",
          location: { type: "Point", coordinates: [0, 0] },
          reliabilityScore: 0.9,
        },
        {
          _id: "vol-good",
          location: { coordinates: [88.364, 22.5727] },
          reliabilityScore: 0.7,
        },
      ];

      const result = modFireflyAlgorithm(donation, volunteers, { topK: 3 });

      expect(result.recipients.length).toBe(1);
      expect(result.recipients[0].volunteerId).toBe("vol-good");
    });

    test("large quantities boost urgency (quantity bonus)", () => {
      const base = { ...donation, urgencyScore: 0.6, quantity: "2" };
      const boosted = modFireflyAlgorithm(
        { ...base, quantity: "40 kg" },
        [{ _id: "vol-1", location: { coordinates: [88.364, 22.5727] }, reliabilityScore: 0.9 }],
        { topK: 1 },
      );

      const baseline = modFireflyAlgorithm(
        base,
        [{ _id: "vol-1", location: { coordinates: [88.364, 22.5727] }, reliabilityScore: 0.9 }],
        { topK: 1 },
      );

      expect(boosted.urgency).toBeGreaterThan(baseline.urgency);
      expect(baseline.urgency).toBe(0.6);
    });

    test("returns an empty list when no volunteer fits within the surge radius", () => {
      const result = modFireflyAlgorithm(
        { ...donation, urgencyScore: 0.05 },
        [
          {
            _id: "far",
            location: { coordinates: [90, 25] }, // ~270 km away
            reliabilityScore: 0.9,
          },
        ],
        { topK: 1 },
      );

      expect(result.recipients.length).toBe(0);
      expect(result.surgeRadiusKm).toBeLessThanOrEqual(7);
    });
  });
});