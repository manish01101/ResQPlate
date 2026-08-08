const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");
const Donation = require("./models/donation");
const Claim = require("./models/claim");
const Notification = require("./models/notification");
const Rating = require("./models/rating");
const ChatMessage = require("./models/chatMessage");

dotenv.config();

const CENTER_LAT = 22.5726;
const CENTER_LNG = 88.3639;

// Safety net: never wipe production data unless explicitly confirmed
if (process.env.NODE_ENV === "production" && !process.env.SEED_CONFIRM) {
  console.error(
    "[seed] Refusing to run in production. Set SEED_CONFIRM=1 to override.",
  );
  process.exit(1);
}

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

// Deterministic location at an exact distance & bearing from center.
// Returns a full GeoJSON location object with address.
function getOffsetLocation(radiusKm, angleDeg, address) {
  const earthRadiusKm = 6371;
  const radians = (angleDeg * Math.PI) / 180;
  const deltaLat =
    (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(radians);
  const deltaLng =
    ((radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(radians)) /
    Math.cos((CENTER_LAT * Math.PI) / 180);

  return {
    type: "Point",
    coordinates: [CENTER_LNG + deltaLng, CENTER_LAT + deltaLat],
    address:
      address ||
      `Kolkata @ ${radiusKm}km bearing ${angleDeg}deg`,
  };
}

function getRandomLocation(radiusKm, addressPrefix = "Seed address") {
  const r = radiusKm / 111.3;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  const newLng = x / Math.cos((CENTER_LAT * Math.PI) / 180);
  return {
    type: "Point",
    coordinates: [CENTER_LNG + newLng, CENTER_LAT + y],
    address: `${addressPrefix} (${Math.round(radiusKm)}km)`,
  };
}

function haversineKm(locA, locB) {
  const R = 6371;
  const [aLng, aLat] = locA;
  const [bLng, bLat] = locB;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(2));
}

// Mirror of the server's expiry → surge radius shaping (km)
function surgeRadiusKm(hoursUntilExpiry) {
  if (hoursUntilExpiry < 1) return 35;
  if (hoursUntilExpiry < 4) return 25;
  if (hoursUntilExpiry < 12) return 18;
  return 12;
}

function urgencyScoreFor(hoursUntilExpiry, foodType) {
  const perishabilityBase = {
    vegetarian: 0.45,
    "non-vegetarian": 0.7,
    vegan: 0.4,
  };
  const base = perishabilityBase[foodType] ?? 0.5;
  const minutesLeft = Math.max(0, hoursUntilExpiry * 60);
  const timePressure = Math.min(1, 1 - minutesLeft / (24 * 60));
  return parseFloat(Math.min(1, base * 0.55 + timePressure * 0.45).toFixed(3));
}

// Approximate mod-FA ranking: reliability + proximity + urgency → faScore
function rankRecipients(donationLocation, recipients, surgeRadiusKmForDonation, hoursUntilExpiry) {
  const urgency = urgencyScoreFor(hoursUntilExpiry, "vegetarian");
  return recipients
    .map((r) => {
      const distanceKm = haversineKm(
        donationLocation,
        r.location.coordinates,
      );
      const faScore = parseFloat(
        (
          0.5 * (r.reliabilityScore || 0.5) +
          0.35 * Math.max(0, 1 - distanceKm / surgeRadiusKmForDonation) +
          0.15 * urgency
        ).toFixed(3),
      );
      return {
        rank: 0,
        volunteerId: r._id,
        name: r.name,
        distanceKm,
        reliabilityScore: r.reliabilityScore || 0.5,
        urgencyScore: urgency,
        surgeRadiusKm: surgeRadiusKmForDonation,
        beta: 0.25,
        faScore,
      };
    })
    .sort((a, b) => b.faScore - a.faScore)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[seed] MongoDB connected.");

    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
      Claim.deleteMany({}),
      Notification.deleteMany({}),
      Rating.deleteMany({}),
      ChatMessage.deleteMany({}),
    ]);
    console.log("[seed] Existing data cleared.");

    // Drop the legacy per-claim unique index if it exists (ratings are
    // unique per claim+rater, not per claim)
    try {
      await Rating.collection.dropIndex("claim_id_1");
      console.log("[seed] Dropped legacy claim_id_1 unique index.");
    } catch {
      /* index does not exist — fine */
    }

    // ---------------------------------------------------------------- Users
    const [admin] = await User.create([
      {
        name: "Admin User",
        email: "admin@gmail.com",
        password: "password",
        role: "admin",
        phone: "9999999999",
        isVerified: true,
        verificationStatus: "verified",
        location: getOffsetLocation(0.2, 0, "Kolkata Admin Center"),
        reliabilityScore: 0.5,
      },
    ]);

    const donors = await User.create([
      {
        name: "Fresh Bakery Donor",
        email: "donor@gmail.com",
        password: "password",
        role: "donor",
        phone: "9123456789",
        isVerified: true,
        verificationStatus: "verified",
        location: getOffsetLocation(1.5, 90, "Kolkata Donor Area"),
        reliabilityScore: 0.9,
        totalPickups: 8,
        totalCancellations: 1,
        avgRating: 4,
        totalRatings: 1,
      },
      {
        name: "Cafe Green Donor",
        email: "donor2@gmail.com",
        password: "password",
        role: "donor",
        phone: "9123456000",
        isVerified: true,
        verificationStatus: "verified",
        location: getOffsetLocation(2, 40, "Cafe Green, Park Street"),
        reliabilityScore: 0.85,
        totalPickups: 2,
        totalCancellations: 0,
      },
      {
        name: "Events Hall Donor",
        email: "donor3@gmail.com",
        password: "password",
        role: "donor",
        phone: "9123456003",
        isVerified: false,
        verificationStatus: "pending",
        location: getOffsetLocation(4, 180, "Kolkata Events Hall"),
        reliabilityScore: 0.5,
      },
    ]);

    const ngos = await User.create([
      {
        name: "Kolkata Food Rescue",
        email: "ngo@gmail.com",
        password: "password",
        role: "ngo",
        phone: "9876543210",
        isVerified: true,
        verificationStatus: "verified",
        reliabilityScore: 0.95,
        totalPickups: 5,
        totalCancellations: 0,
        avgRating: 5,
        totalRatings: 1,
        location: getOffsetLocation(2.5, 90, "Kolkata NGO Hub"),
      },
      {
        name: "Green Plate NGO",
        email: "greenplate@example.com",
        password: "password",
        role: "ngo",
        phone: "9000000003",
        isVerified: true,
        verificationStatus: "verified",
        reliabilityScore: 0.88,
        totalPickups: 4,
        totalCancellations: 1,
        location: getOffsetLocation(5, 200, "Green Plate Area"),
      },
      {
        name: "Community Fridge Network",
        email: "fridge@example.com",
        password: "password",
        role: "ngo",
        phone: "9000000004",
        isVerified: true,
        verificationStatus: "verified",
        reliabilityScore: 0.91,
        totalPickups: 5,
        location: getOffsetLocation(8, 30, "Fridge Network Area"),
      },
      {
        name: "Safe Meals Collective",
        email: "safemeals@example.com",
        password: "password",
        role: "ngo",
        phone: "9000000005",
        isVerified: true,
        verificationStatus: "verified",
        reliabilityScore: 0.84,
        totalPickups: 2,
        totalCancellations: 1,
        location: getOffsetLocation(12, 150, "Safe Meals Area"),
      },
      {
        name: "New Hope Kitchens",
        email: "pending@example.com",
        password: "password",
        role: "ngo",
        phone: "9000000006",
        isVerified: false,
        verificationStatus: "pending",
        aadhaarNumber: "1234 5678 9012",
        verificationDocumentType: "registration-certificate",
        verificationSubmittedAt: hoursFromNow(-30),
        location: getOffsetLocation(3, 70, "New Hope Area"),
      },
      {
        name: "Unregistered Kitchen",
        email: "unregistered@example.com",
        password: "password",
        role: "ngo",
        phone: "9000000007",
        isVerified: false,
        verificationStatus: "unverified",
        location: getOffsetLocation(9, 300, "Unregistered Area"),
      },
    ]);

    const donor = donors[0];
    const donor2 = donors[1];
    const ngo = ngos[0];
    const greenPlate = ngos[1];
    const fridge = ngos[2];
    const safeMeals = ngos[3];
    const matchingNgos = [ngo, greenPlate, fridge, safeMeals];

    // --------------------------------------------------- base pool (10)
    const foodItems = [
      "Veg Biryani",
      "Surplus Bread & Pastries",
      "Rice and Dal",
      "Mixed Veg Curry",
      "Paneer Tikka",
      "Non-Veg Thali",
      "Fruit Salad",
      "Vegan Wraps",
    ];
    const randomDonations = [];
    for (let i = 0; i < 10; i++) {
      const hoursLeft = Math.floor(Math.random() * 10) + 2;
      randomDonations.push({
        donor_id: i % 2 === 0 ? donor._id : donor2._id,
        food_title: `${foodItems[Math.floor(Math.random() * foodItems.length)]} (Batch ${i + 1})`,
        quantity: `Serves ${Math.floor(Math.random() * 40) + 10} people`,
        food_type: Math.random() > 0.3 ? "vegetarian" : "non-vegetarian",
        expiry_datetime: hoursFromNow(hoursLeft),
        status: "available",
        surgeRadiusKm: surgeRadiusKm(hoursLeft),
        location: getRandomLocation(2 + Math.random() * 16, `Seed address ${i + 1}`),
      });
    }
    await Donation.create(randomDonations);

    // Centerpiece — full recommendedRecipients for the donor
    // dashboard "Your Matches" panel and the mod-FA flow.
    const biryaniSurge = surgeRadiusKm(8);
    const biryaniLocation = getOffsetLocation(0.1, 0, "Kolkata City Center");
    const biryaniDonation = await Donation.create({
      donor_id: donor._id,
      food_title: "Fresh Veg Biryani Pack",
      quantity: "Serves 20 people",
      food_type: "vegetarian",
      expiry_datetime: hoursFromNow(8),
      status: "available",
      surgeRadiusKm: biryaniSurge,
      location: biryaniLocation,
      notes: "Please pick up soon. Seed data for mod-FA check.",
      recommendedRecipients: rankRecipients(
        biryaniLocation.coordinates,
        matchingNgos,
        biryaniSurge,
        8,
      ),
    });

    // Urgent non-veg donation — expires in <1h, huge surge radius
    const urgentSurge = surgeRadiusKm(0.75);
    const urgentLocation = getOffsetLocation(2, 45, "Sealdah Junction");
    const urgentDonation = await Donation.create({
      donor_id: donor._id,
      food_title: "Non-Veg Thali (Hot & Ready)",
      quantity: "Serves 30 people",
      food_type: "non-vegetarian",
      expiry_datetime: hoursFromNow(0.75),
      status: "available",
      surgeRadiusKm: urgentSurge,
      location: urgentLocation,
      recommendedRecipients: rankRecipients(
        urgentLocation.coordinates,
        matchingNgos,
        urgentSurge,
        0.75,
      ),
    });

    // Mid-urgency vegetarian
    const midDonation = await Donation.create({
      donor_id: donor2._id,
      food_title: "Rice & Dal Combo (10 L)",
      quantity: "Serves 50 people",
      food_type: "vegetarian",
      expiry_datetime: hoursFromNow(5),
      status: "available",
      surgeRadiusKm: surgeRadiusKm(5),
      location: getOffsetLocation(6, 160, "Gariahat Market"),
    });

    // Long shelf-life vegan — far away, low urgency
    const veganDonation = await Donation.create({
      donor_id: donor2._id,
      food_title: "Vegan Wraps (Shelf-Stable)",
      quantity: "Serves 15 people",
      food_type: "vegan",
      expiry_datetime: hoursFromNow(36),
      status: "available",
      location: getOffsetLocation(14, 250, "New Town"),
    });

    // Expired — auto-flagging cron demo
    await Donation.create({
      donor_id: donor._id,
      food_title: "Paneer Tikka (Cold Storage)",
      quantity: "Serves 25 people",
      food_type: "vegetarian",
      expiry_datetime: hoursFromNow(-2),
      expiredAt: hoursFromNow(-1),
      status: "expired",
      location: getOffsetLocation(7, 210, "Ballygunge"),
    });

    // Claimed — locked donation with an active accepted claim + pickup PIN
    const claimedDonation = await Donation.create({
      donor_id: donor._id,
      food_title: "Fresh Fruit Salad Basket",
      quantity: "Serves 12 people",
      food_type: "vegan",
      expiry_datetime: hoursFromNow(3),
      status: "claimed",
      claimed_by: ngo._id,
      claimed_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      surgeRadiusKm: surgeRadiusKm(3),
      location: getOffsetLocation(1.5, 90, "Donor Counter, Park Street"),
    });

    // Completed — full lifecycle: claim → OTP → completed → rated + chatted
    const completedDonation = await Donation.create({
      donor_id: donor._id,
      food_title: "Mixed Veg Curry & Rice",
      quantity: "Serves 40 people",
      food_type: "vegetarian",
      expiry_datetime: hoursFromNow(-3),
      status: "completed",
      claimed_by: ngo._id,
      claimed_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
      location: getOffsetLocation(3, 90, "Completed Pickup Spot"),
    });

    // Cancelled — NGO cancelled after accepting (reliability penalty demo)
    const cancelledDonation = await Donation.create({
      donor_id: donor._id,
      food_title: "Mini Paneer Platter",
      quantity: "Serves 8 people",
      food_type: "vegetarian",
      expiry_datetime: hoursFromNow(6),
      status: "available",
      location: getOffsetLocation(2.2, 135, "ITC Maurya"),
    });

    // -------------------------------------------------------------- Claims
    const [claimAccepted, claimPending, claimCompleted, claimCancelled] =
      await Claim.create([
        {
          donation_id: claimedDonation._id,
          receiver_id: ngo._id,
          status: "accepted",
          pickup_pin: "123456",
          faScore: 0.95,
          distanceKm: 2.1,
          acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          notes: "Active pickup — you can demo OTP verify with PIN 123456.",
        },
        {
          donation_id: biryaniDonation._id,
          receiver_id: greenPlate._id,
          status: "pending",
          faScore: 0.91,
          distanceKm: 6.5,
          notes: "Pending claim to exercise the donor approve/reject flow.",
        },
        {
          donation_id: completedDonation._id,
          receiver_id: ngo._id,
          status: "completed",
          pickup_pin: "246810",
          requestedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
          acceptedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          faScore: 0.93,
          distanceKm: 3.2,
          notes: "Completed handoff — demo ratings & chat history.",
        },
        {
          donation_id: cancelledDonation._id,
          receiver_id: ngo._id,
          status: "cancelled",
          cancelledBy: "ngo",
          cancelledAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          faScore: 0.8,
          distanceKm: 2.9,
          notes: "NGO cancelled after request acceptance — reliability penalty demo.",
        },
      ]);

    // ------------------------------------------------------- Notifications
    await Notification.create([
      {
        recipient: ngo._id,
        sender: donor._id,
        type: "claim_accepted",
        title: "Pickup approved",
        message: `Your claim for "${claimedDonation.food_title}" was approved. Pickup PIN: 123456`,
        relatedId: claimAccepted._id,
        link: `/claims/${claimAccepted._id}`,
        read: true,
        readAt: new Date(),
        data: { donationId: claimedDonation._id },
      },
      {
        recipient: donor._id,
        sender: greenPlate._id,
        type: "claim_request",
        title: "New pickup request",
        message: `Green Plate NGO requested to claim "${biryaniDonation.food_title}".`,
        relatedId: claimPending._id,
        link: `/donations/${biryaniDonation._id}`,
        read: false,
        data: { donationId: biryaniDonation._id },
      },
      {
        recipient: ngo._id,
        sender: donor._id,
        type: "new_donation",
        title: "New donation nearby",
        message: `"${urgentDonation.food_title}" was posted within your surge radius (${urgentSurge}km).`,
        relatedId: urgentDonation._id,
        link: "/find-food",
        read: true,
        readAt: new Date(),
        data: { donationId: urgentDonation._id },
      },
      {
        recipient: ngo._id,
        sender: admin._id,
        type: "account_verified",
        title: "Account verified",
        message:
          "Your NGO account has been verified. You can now claim donations.",
        read: true,
        readAt: new Date(),
      },
      {
        recipient: donor._id,
        sender: ngo._id,
        type: "claim_completed",
        title: "Pickup completed",
        message: `${ngo.name} completed the pickup for "${completedDonation.food_title}".`,
        relatedId: claimCompleted._id,
        link: `/claims/${claimCompleted._id}`,
        read: false,
      },
      {
        recipient: donor._id,
        sender: ngo._id,
        type: "claim_cancelled",
        title: "Pickup cancelled",
        message: `${ngo.name} cancelled the pickup for "${cancelledDonation.food_title}".`,
        relatedId: claimCancelled._id,
        link: `/donations/${cancelledDonation._id}`,
        read: false,
      },
      {
        recipient: ngo._id,
        sender: donor._id,
        type: "chat",
        title: "New chat message",
        message: "Thanks for confirming — see you at the location!",
        relatedId: claimAccepted._id,
        link: `/claims/${claimAccepted._id}`,
        read: false,
        data: { claimId: claimAccepted._id },
      },
      {
        recipient: admin._id,
        sender: null,
        type: "system",
        title: "Seed data ready",
        message: "The database has been seeded. All modules are testable.",
        read: false,
      },
    ]);

    // ------------------------------------------------------------- Ratings
    await Rating.create([
      {
        claim_id: claimCompleted._id,
        rater_id: donor._id,
        recipient_id: ngo._id,
        rating: 5,
        review: "Very punctual and caring volunteers. Highly recommended.",
      },
      {
        claim_id: claimCompleted._id,
        rater_id: ngo._id,
        recipient_id: donor._id,
        rating: 4,
        review: "Food quality was excellent. Smooth handoff!",
      },
    ]);

    // ------------------------------------------------------- Chat messages
    await ChatMessage.create([
      {
        claim_id: claimAccepted._id,
        sender_id: ngo._id,
        sender_name: ngo.name,
        body: "Hi! We are on our way. ETA 15 minutes.",
      },
      {
        claim_id: claimAccepted._id,
        sender_id: donor._id,
        sender_name: donor.name,
        body: "Thanks — the food is packed and ready at the counter.",
      },
      {
        claim_id: claimCompleted._id,
        sender_id: donor._id,
        sender_name: donor.name,
        body: "Great cooperation. Left a rating for you!",
      },
    ]);

    await Promise.all([
      Donation.collection.createIndex({ location: "2dsphere" }),
      User.collection.createIndex({ location: "2dsphere" }),
    ]);

    console.log("");
    console.log("✅ Seed data imported successfully!");
    console.log("");
    console.log("Accounts (password: password)");
    console.log("  Admin  : admin@gmail.com");
    console.log(
      "  Donors : donor@gmail.com, donor2@gmail.com, donor3@gmail.com (verification pending)",
    );
    console.log(
      "  NGOs   : ngo@gmail.com, greenplate@example.com, fridge@example.com, safemeals@example.com",
    );
    console.log(
      "           pending@example.com (verification pending), unregistered@example.com (unverified)",
    );
    console.log("");
    console.log("Key donations:");
    console.log(`  ${biryaniDonation.food_title}  (${biryaniDonation._id}) — recommendedRecipients filled`);
    console.log(`  ${urgentDonation.food_title} (${urgentDonation._id}) — urgent, surge ${urgentSurge}km`);
    console.log(`  ${midDonation.food_title} (${midDonation._id})`);
    console.log(`  ${veganDonation.food_title} (${veganDonation._id})`);
    console.log("  ... plus 10 random batches and expired/claimed/completed/cancelled states");
    console.log("");
    console.log("Claims:");
    console.log(`  accepted + PIN 123456 → donation ${claimedDonation._id}`);
    console.log(`  pending              → donation ${biryaniDonation._id}`);
    console.log(`  completed + rated    → donation ${completedDonation._id}`);
    console.log(`  cancelled by NGO     → donation ${cancelledDonation._id}`);
    console.log("");
    console.log("Extras: 8 notifications, 2 ratings, 3 chat messages, 2 geo indexes.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();