import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.model.js";
dotenv.config();

const DB_URL = process.env.MONGODB_URL;

export const initDB = async () => {
  try {
    const res = await mongoose.connect(DB_URL);
    if (res) {
      console.log("DB connected");
    }
  } catch (error) {
    console.log("error occured while connecting DB", error.message);
  }
};

export const initAdmin = async (params) => {
  // create admin
  const admin_email = process.env.ADMIN_EMAIL.toLowerCase();
  const admin_password = process.env.ADMIN_PASSWORD;
  // check whether admin already exist

  try {
    const adminExist = await User.findOne({ email: admin_email });
    if (!adminExist) {
      const newAdmin = new User({
        email: admin_email,
        password: admin_password,
        role: "admin",
        phone: 9999999999,
        name: "Admin",
        location: [34, 34],
      });
      await newAdmin.save();
      console.log("admin saved successfully!");
    } else {
      console.log("admin already exist");
    }
  } catch (error) {
    console.log("error occured admin setup", error.message);
  }
};
