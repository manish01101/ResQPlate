import express from "express";
import { initAdmin, initDB } from "./db.js";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/User.model.js";
const PORT = process.env.PORT;
import jwt from "jsonwebtoken";
import middleware from "./middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

initDB();
initAdmin();

// only for dev purpose
// app.get("/deleteUser", async (req, res) => {
//   try {
//     const result = await User.deleteMany({});
//     res.json({ message: "users deleted" });
//   } catch (error) {
//     console.log(error);
//   }
// });

app.get("/", (req, res) => {
  res.json({ msg: "hi backend" });
});

app.get("/api/me", middleware, (req, res) => {
  res
    .status(201)
    .json({ message: "Auth Check Successful!", role: req.user.role });
});

app.post("/api/signup", async (req, res) => {
  const { name, email, password, phone, role, address, location } = req.body;
  //   console.log(body);
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exist!" });
    }
    const newUser = new User({
      name,
      email,
      password,
      phone,
      role,
      address,
      location,
    });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );
    res.status(201).json({ message: "Registered Successfully", token, role });
  } catch (error) {
    res.status(404).json({ message: "error while registration", error });
  }
});

app.post("/api/signin", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "User not found!" });
    }
    const isMatch = user ? (password === user.password ? true : false) : false;

    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    // console.log(user._id, process.env.JWT_SECRET);
    res
      .status(201)
      .json({ message: "Signin Successfull!", token, role: user.role });
  } catch (error) {
    res.status(404).json({ message: "Error while signin ", error });
  }
});

app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});
