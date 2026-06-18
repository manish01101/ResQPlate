// // backend/seed.js
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const User = require('./models/user');
// const Donation = require('./models/donation');
// const Claim = require('./models/claim')

// // Load env vars
// dotenv.config();

// // Center Coordinates: Lat: 22.47517, Lng: 88.41864
// const CENTER_LAT = 22.47517;
// const CENTER_LNG = 88.41864;

// // Helper function: Generate random coordinates within a radius (km)
// function getRandomLocation(centerLat, centerLng, radiusKm) {
//   const r = radiusKm / 111.3; // Convert km to degrees
//   const u = Math.random();
//   const v = Math.random();
//   const w = r * Math.sqrt(u);
//   const t = 2 * Math.PI * v;
//   const x = w * Math.cos(t);
//   const y = w * Math.sin(t);
//   const newLng = x / Math.cos((centerLat * Math.PI) / 180);
//   return [centerLng + newLng, centerLat + y]; // Returns [lng, lat] for MongoDB
// }

// const seedData = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB Connected...');

//     // 1. Clear existing data
//     await User.deleteMany();
//     await Donation.deleteMany();
//     await Claim.deleteMany();
//     console.log('Existing data cleared.');

//     // 2. Create Users (Password for all is 'password123')
//     const users = await User.create([
//       {
//         name: 'Admin User',
//         email: 'admin@resqplate.com',
//         password: 'password123',
//         role: 'admin',
//         phone: '9999999999',
//         location: { type: 'Point', coordinates: [CENTER_LNG, CENTER_LAT] },
//         isVerified: true
//       },
//       {
//         name: 'Helping Hands NGO',
//         email: 'ngo@example.com',
//         password: 'password123',
//         role: 'ngo',
//         phone: '9876543210',
//         location: { type: 'Point', coordinates: getRandomLocation(CENTER_LAT, CENTER_LNG, 5) },
//         isVerified: true,
//         reliabilityScore: 0.95
//       },
//       {
//         name: 'Fresh Bakery Donor',
//         email: 'donor@example.com',
//         password: 'password123',
//         role: 'donor',
//         phone: '9123456789',
//         location: { type: 'Point', coordinates: [CENTER_LNG, CENTER_LAT] },
//         isVerified: true
//       }
//     ]);

//     const donorId = users[2]._id; // Get the donor's ID

//     // 3. Generate 15 Dummy Donations within 20km radius
//     const foodItems = ['Veg Biryani', 'Surplus Bread & Pastries', 'Rice and Dal', 'Mixed Veg Curry', 'Paneer Tikka', 'Non-Veg Thali', 'Fruit Salad', 'Vegan Wraps'];
//     const donationsToInsert = [];

//     for (let i = 0; i < 15; i++) {
//       const coords = getRandomLocation(CENTER_LAT, CENTER_LNG, 20); // within 20km

//       donationsToInsert.push({
//         donor_id: donorId,
//         food_title: foodItems[Math.floor(Math.random() * foodItems.length)] + ` (Batch ${i+1})`,
//         quantity: `Serves ${Math.floor(Math.random() * 40) + 10} people`,
//         food_type: Math.random() > 0.3 ? 'vegetarian' : 'non-vegetarian',
//         // Set expiry date to 2-12 hours in the future
//         expiry_datetime: new Date(Date.now() + (Math.floor(Math.random() * 10) + 2) * 60 * 60 * 1000),
//         status: 'available',
//         location: {
//           type: 'Point',
//           coordinates: coords, // [lng, lat]
//           address: `Random Address near coordinates ${coords[1].toFixed(3)}, ${coords[0].toFixed(3)}`
//         },
//         notes: 'Please bring containers. Seed data.'
//       });
//     }

//     await Donation.create(donationsToInsert);

//     // Ensure MongoDB creates the geospatial index for the $near query
//     await Donation.collection.createIndex({ location: '2dsphere' });

//     console.log('✅ Seed Data Imported Successfully!');
//     console.log('Test Accounts:');
//     console.log('NGO: ngo@example.com | Pass: password123');
//     console.log('Donor: donor@example.com | Pass: password123');
//     process.exit();

//   } catch (error) {
//     console.error('Error seeding data:', error);
//     process.exit(1);
//   }
// };

// seedData();

// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");
const Donation = require("./models/donation");
const Claim = require("./models/claim");

// Load env vars
dotenv.config();

// Center Coordinates
const CENTER_LAT = 22.5829;
const CENTER_LNG = 88.3751;

// Helper function: Generate random coordinates within a radius (km)
function getRandomLocation(centerLat, centerLng, radiusKm) {
  const r = radiusKm / 111.3; // Convert km to degrees
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  const newLng = x / Math.cos((centerLat * Math.PI) / 180);
  return [centerLng + newLng, centerLat + y]; // Returns [lng, lat] for MongoDB
}

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");

    // 1. Clear existing data
    await User.deleteMany();
    await Donation.deleteMany();
    await Claim.deleteMany();
    console.log("Existing data cleared.");

    // 2. Create Users (Password for all is 'password123')
    const users = await User.create([
      {
        name: "Admin User",
        email: "admin@resqplate.com",
        password: "password123",
        role: "admin",
        phone: "9999999999",
        location: { type: "Point", coordinates: [CENTER_LNG, CENTER_LAT] },
        isVerified: true,
      },
    ]);

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
