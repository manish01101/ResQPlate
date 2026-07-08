const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected successfully");
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
