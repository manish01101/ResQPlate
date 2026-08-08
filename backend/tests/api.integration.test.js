process.env.JWT_SECRET = "test_secret_key_for_jest_123";

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const User = require("../models/user");
const Donation = require("../models/donation");
const Claim = require("../models/claim");

const authRoutes = require("../routes/auth");
const donationRoutes = require("../routes/donations");
const claimRoutes = require("../routes/claims");

let mongoServer;
let app;

// ==========================================
// SETUP & TEARDOWN
// ==========================================
beforeAll(async () => {
  // Replica set (1 node) — required for claim flow transactions
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Force Mongoose to finish building 2dsphere indexes
  // before running tests to prevent 500 Internal Server Errors on $near queries.
  await User.createIndexes();
  await Donation.createIndexes();
  await Claim.createIndexes();

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/donations", donationRoutes);
  app.use("/api/claims", claimRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// ==========================================
// TEST SUITE: AUTHENTICATION
// ==========================================
describe("Authentication Routes", () => {
  const validUserPayload = {
    name: "NGO Test",
    email: "ngo@test.com",
    password: "securepassword",
    role: "ngo",
    phone: "1234567890",
    location: {
      type: "Point",
      coordinates: [88.3639, 22.5726],
      address: "Kolkata",
    },
  };

  test("TC01: Register with an already-used email returns 400", async () => {
    await request(app).post("/api/auth/register").send(validUserPayload);
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload);
    expect(response.status).toBe(400);
  });

  test("TC02: Login with incorrect password returns 401 Unauthorized", async () => {
    await request(app).post("/api/auth/register").send(validUserPayload);
    const response = await request(app).post("/api/auth/login").send({
      email: validUserPayload.email,
      password: "wrongpassword",
    });
    expect(response.status).toBe(401);
  });
});

// ==========================================
// TEST SUITE: DONATIONS
// ==========================================
describe("Donation Routes", () => {
  let donorToken;

  beforeEach(async () => {
    const verifiedDonor = await User.create({
      name: "Donor Test",
      email: "donor@test.com",
      password: "password123",
      role: "donor",
      phone: "1234567890",
      isVerified: true,
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726],
        address: "Kolkata",
      },
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "donor@test.com",
      password: "password123",
    });
    donorToken = res.body.token;
  });

  test("TC03: Donor posts food with expiry in the past returns Validation Error", async () => {
    const pastDate = new Date(Date.now() - 100000).toISOString();

    const response = await request(app)
      .post("/api/donations")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        food_title: "Stale Food",
        quantity: "5 kg",
        food_type: "vegetarian",
        expiry_datetime: pastDate,
        location: {
          type: "Point",
          coordinates: [88.3639, 22.5726],
          address: "Test St",
        },
      });

    expect(response.status).toBe(400);
  });

  test("TC04: NGO requests donation outside search radius is not included", async () => {
    await request(app)
      .post("/api/donations")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        food_title: "Fresh Food",
        quantity: "10 kg",
        expiry_datetime: new Date(Date.now() + 86400000).toISOString(),
        location: {
          type: "Point",
          coordinates: [88.3639, 22.5726],
          address: "Test St",
        },
      });

    const response = await request(app)
      .get("/api/donations/nearby?lng=77.1025&lat=28.7041&radius=20")
      .set("Authorization", `Bearer ${donorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(0);
  });

  test("stores and returns mod-FA recommended recipients for a donation", async () => {
    await User.create({
      name: "Nearby NGO",
      email: "nearby.ngo@test.com",
      password: "password123",
      role: "ngo",
      phone: "5555555555",
      isVerified: true,
      reliabilityScore: 0.95,
      location: {
        type: "Point",
        coordinates: [88.3641, 22.5728],
        address: "Kolkata",
      },
    });

    const createResponse = await request(app)
      .post("/api/donations")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        food_title: "Fresh Food",
        quantity: "10 kg",
        food_type: "vegetarian",
        expiry_datetime: new Date(Date.now() + 86400000).toISOString(),
        location: {
          type: "Point",
          coordinates: [88.3639, 22.5726],
          address: "Test St",
        },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.recommendedRecipients).toBeDefined();
    expect(createResponse.body.recommendedRecipients.length).toBeGreaterThan(0);

    const donationId = createResponse.body.data._id;
    const detailResponse = await request(app)
      .get(`/api/donations/${donationId}`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(detailResponse.status).toBe(200);
    expect(
      detailResponse.body.data.recommendedRecipients.length,
    ).toBeGreaterThan(0);
  });

  test("returns surge radius snapshot and match ranking breakdown for donor", async () => {
    await User.create({
      name: "Nearby NGO",
      email: "nearby.ranking@test.com",
      password: "password123",
      role: "ngo",
      phone: "6666666666",
      isVerified: true,
      reliabilityScore: 0.9,
      location: {
        type: "Point",
        coordinates: [88.3641, 22.5728],
        address: "Kolkata",
      },
    });

    const createResponse = await request(app)
      .post("/api/donations")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        food_title: "Urgent Food",
        quantity: "2",
        food_type: "non-vegetarian",
        expiry_datetime: new Date(Date.now() + 30 * 60000).toISOString(),
        location: {
          type: "Point",
          coordinates: [88.3639, 22.5726],
          address: "Test St",
        },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.surgeRadiusKm).toBeGreaterThan(5);
    expect(createResponse.body.data.surgeRadiusKm).toBeGreaterThan(5);

    const donationId = createResponse.body.data._id;
    const rankingResponse = await request(app)
      .get(`/api/donations/ranking/${donationId}`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(rankingResponse.status).toBe(200);
    expect(rankingResponse.body.data.surgeRadiusKm).toBeGreaterThan(5);
    expect(Array.isArray(rankingResponse.body.data.candidates)).toBe(true);
  });

  test("invalid ObjectId returns 400 instead of 500", async () => {
    const response = await request(app)
      .get("/api/donations/not-an-id")
      .set("Authorization", `Bearer ${donorToken}`);
    expect(response.status).toBe(400);
  });
});

// ==========================================
// TEST SUITE: CLAIMS & VERIFICATION
// ==========================================
describe("Claim Routes", () => {
  let unverifiedNgoToken;
  let verifiedNgoToken;
  let verifiedNgoId;
  let testDonationId;

  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Unverified NGO",
        email: "unverified@test.com",
        password: "password123",
        role: "ngo",
        phone: "1111111111",
        location: {
          type: "Point",
          coordinates: [88.3639, 22.5726],
          address: "Kolkata",
        },
      });
    const unverifiedRes = await request(app).post("/api/auth/login").send({
      email: "unverified@test.com",
      password: "password123",
    });
    unverifiedNgoToken = unverifiedRes.body.token;

    const verifiedNgo = await User.create({
      name: "Verified NGO",
      email: "verified@test.com",
      password: "password123",
      role: "ngo",
      phone: "2222222222",
      isVerified: true,
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726],
        address: "Kolkata",
      },
    });
    verifiedNgoId = verifiedNgo._id;
    const verifiedRes = await request(app).post("/api/auth/login").send({
      email: "verified@test.com",
      password: "password123",
    });
    verifiedNgoToken = verifiedRes.body.token;

    const donation = await Donation.create({
      donor_id: new mongoose.Types.ObjectId(),
      food_title: "Test Meal",
      quantity: "2",
      expiry_datetime: new Date(Date.now() + 86400000),
      status: "available",
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726],
        address: "Kolkata",
      },
    });
    testDonationId = donation._id;
  });

  test("TC07: Unverified NGO account attempts to raise a claim is blocked", async () => {
    const response = await request(app)
      .post(`/api/claims`)
      .set("Authorization", `Bearer ${unverifiedNgoToken}`)
      .send({ donation_id: testDonationId });

    expect(response.status).toBe(403);
  });

  test("TC05: NGO enters incorrect OTP at pickup allows retry", async () => {
    const claim = await Claim.create({
      donation_id: testDonationId,
      receiver_id: verifiedNgoId,
      status: "accepted",
      pickup_pin: "1234",
    });

    const response = await request(app)
      .post(`/api/claims/${claim._id}/verify`)
      .set("Authorization", `Bearer ${verifiedNgoToken}`)
      .send({ pickup_pin: "9999" });

    expect(response.status).toBe(400);

    const updatedClaim = await Claim.findById(claim._id);
    expect(updatedClaim.status).not.toBe("completed");
  });

  test("completed claims cannot be completed out of order (400)", async () => {
    const claim = await Claim.create({
      donation_id: testDonationId,
      receiver_id: verifiedNgoId,
      status: "pending",
    });

    const response = await request(app)
      .post(`/api/claims/${claim._id}/verify`)
      .set("Authorization", `Bearer ${verifiedNgoToken}`)
      .send({ pickup_pin: "1234" });

    expect(response.status).toBe(400);
  });

  test("donor rejection does NOT penalize the volunteer's reliability", async () => {
    const reliableVolunteer = await User.create({
      name: "Reliable NGO",
      email: "reliable@test.com",
      password: "password123",
      role: "ngo",
      phone: "3333333333",
      isVerified: true,
      reliabilityScore: 0.8,
      totalPickups: 4,
      totalCancellations: 1,
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726],
        address: "Kolkata",
      },
    });

    const claim = await Claim.create({
      donation_id: testDonationId,
      receiver_id: reliableVolunteer._id,
      status: "pending",
    });

    const donor = await User.create({
      name: "Donor Cindy",
      email: "donor.cancel@test.com",
      password: "password123",
      role: "donor",
      phone: "4444444444",
      isVerified: true,
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726],
        address: "Kolkata",
      },
    });
    const donorLogin = await request(app).post("/api/auth/login").send({
      email: "donor.cancel@test.com",
      password: "password123",
    });
    const donorToken = donorLogin.body.token;

    // Donation belongs to the cancelling donor
    await Donation.findByIdAndUpdate(testDonationId, { donor_id: donor._id });

    const response = await request(app)
      .put(`/api/claims/${claim._id}/cancel`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(response.status).toBe(200);

    const after = await User.findById(reliableVolunteer._id);
    expect(after.totalCancellations).toBe(1);
    expect(after.reliabilityScore).toBe(0.8);
  });
});
