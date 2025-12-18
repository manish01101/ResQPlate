import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.MONGODB_URL;

export const initDB = async () => {
  try {
    const res = await mongoose.connect(DB_URL);
    if (res) {
      console.log("DB connected");
    }
  } catch (error) {
    console.log("error occured while connecting DB");
  }
};
