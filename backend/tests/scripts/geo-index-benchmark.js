require("dotenv").config();
const mongoose = require("mongoose");
const Donation = require("../../models/donation");

async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
}

async function clearData() {
  await Donation.deleteMany({});
}

// Account for Earth's curvature so the radius is a true circle
function randomPoint(centerLat, centerLng, radiusKm) {
  const radiusInDegrees = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  const y = w * Math.sin(t);
  // Adjust longitude based on latitude projection
  const x = (w * Math.cos(t)) / Math.cos((centerLat * Math.PI) / 180);

  return {
    lat: centerLat + y,
    lng: centerLng + x,
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function seedData(count = 2000) {
  const centerLat = 22.5726; // Kolkata
  const centerLng = 88.3639;
  const docs = [];

  for (let i = 0; i < count; i += 1) {
    const point = randomPoint(centerLat, centerLng, 30);
    docs.push({
      donor_id: new mongoose.Types.ObjectId(),
      food_title: `Benchmark Donation ${i + 1}`,
      quantity: "5 servings",
      expiry_datetime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: "available",
      location: {
        type: "Point",
        coordinates: [point.lng, point.lat],
        address: `Sample address ${i + 1}`,
      },
    });
  }

  // Insert in bulk for faster seeding
  await Donation.insertMany(docs);
  console.log(`Seeded ${count} dynamic donation documents...`);
}

async function benchmarkLinear(centerPoint, maxDistanceMeters) {
  const start = process.hrtime.bigint();

  // 1. Download ALL available donations into Node.js memory
  const docs = await Donation.find({ status: "available" }).lean();

  // 2. Loop through every single one to calculate distance
  const result = docs.filter((doc) => {
    const [lng, lat] = doc.location.coordinates;
    return (
      haversineDistance(
        centerPoint.coordinates[1],
        centerPoint.coordinates[0],
        lat,
        lng,
      ) <=
      maxDistanceMeters / 1000
    );
  });

  // 3. Sort them by distance
  const sorted = result.sort((a, b) => {
    const [lngA, latA] = a.location.coordinates;
    const [lngB, latB] = b.location.coordinates;
    const dA = haversineDistance(
      centerPoint.coordinates[1],
      centerPoint.coordinates[0],
      latA,
      lngA,
    );
    const dB = haversineDistance(
      centerPoint.coordinates[1],
      centerPoint.coordinates[0],
      latB,
      lngB,
    );
    return dA - dB;
  });

  // Slice the top 20 so it is a fair comparison to the indexed query
  const top20 = sorted.slice(0, 20);

  const end = process.hrtime.bigint();
  return {
    durationMs: Number(end - start) / 1e6,
    matched: top20.length,
  };
}

async function benchmarkIndexed(centerPoint, maxDistanceMeters) {
  const start = process.hrtime.bigint();

  // MongoDB handles the calculation, sorting, and limiting natively
  const result = await Donation.collection
    .find({
      status: "available",
      location: {
        $near: {
          $geometry: centerPoint,
          $maxDistance: maxDistanceMeters,
        },
      },
    })
    .limit(20)
    .toArray();

  const end = process.hrtime.bigint();
  return {
    durationMs: Number(end - start) / 1e6,
    matched: result.length,
  };
}

async function runBenchmark(size) {
  await clearData();
  await seedData(size);

  // Ensure the geo-spatial index is built
  await Donation.collection.createIndex({ location: "2dsphere" });

  const centerPoint = {
    type: "Point",
    coordinates: [88.3639, 22.5726], // [Lng, Lat]
  };
  const maxDistanceMeters = 5000;

  // Run a query first to load indexes into RAM and avoid "cold start" penalties
  await Donation.findOne({});

  // Run the actual benchmarks
  const linear = await benchmarkLinear(centerPoint, maxDistanceMeters);
  const indexed = await benchmarkIndexed(centerPoint, maxDistanceMeters);
  const speedup = linear.durationMs / indexed.durationMs;

  return {
    size,
    linearMs: linear.durationMs.toFixed(2),
    indexedMs: indexed.durationMs.toFixed(2),
    speedup: speedup.toFixed(1),
  };
}

async function main() {
  await connect();
  const sizes = [100, 1000, 5000, 10000];
  const results = [];

  console.log("\nStarting Geo-Spatial Benchmark...\n");

  for (const size of sizes) {
    const res = await runBenchmark(size);
    results.push(res);
  }

  // Formatting the output to exactly match the table in your PDF report
  console.log(
    "\n\n==================================================================================",
  );
  console.log("Query Performance: Linear Scan vs. 2dsphere Indexing");
  console.log(
    "==================================================================================",
  );
  console.log(
    "Dataset Size (Users) | Linear Search (ms) | Geo-Spatial Search (ms) | Improvement",
  );
  console.log(
    "----------------------------------------------------------------------------------",
  );

  results.forEach((r) => {
    console.log(
      `${r.size.toString().padEnd(20)} | ` +
        `${r.linearMs.toString().padEnd(14)} ms | ` +
        `${r.indexedMs.toString().padEnd(19)} ms | ` +
        `${r.speedup}x faster`,
    );
  });
  console.log(
    "==================================================================================\n",
  );

  await clearData(); // Clean up DB after testing
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
