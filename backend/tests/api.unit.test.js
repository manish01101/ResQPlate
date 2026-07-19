const {
  haversineDistance,
  modFireflyAlgorithm,
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

  describe("modFireflyAlgorithm (Priority Matching Engine)", () => {
    const donation = {
      location: { coordinates: [88.3639, 22.5726] },
      urgencyScore: 1.0,
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

      expect(result[0].volunteerId).toBe("vol-2");
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
      expect(result[0].volunteerId).toBe("vol-2");
    });
  });
});
