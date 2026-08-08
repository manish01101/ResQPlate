process.env.JWT_SECRET = "test_secret_key_for_jest_123";

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { WebSocket } = require("ws");

const User = require("../models/user");
const Donation = require("../models/donation");
const Claim = require("../models/claim");
const Notification = require("../models/notification");
const hub = require("../sockets/wsServer");

let mongoServer;
let server;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.createIndexes();
  await Donation.createIndexes();
  await Claim.createIndexes();

  server = http.createServer();
  hub.start(server);
  await new Promise((resolve) => server.listen(0, resolve));
});

afterAll(async () => {
  // Terminate every client so the HTTP server can close cleanly
  hub.wss?.clients?.forEach((c) => c.terminate());
  await new Promise((r) => setTimeout(r, 100));
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

const connectSocket = (userId) =>
  new Promise((resolve, reject) => {
    const port = server.address().port;
    const ws = new WebSocket(`ws://localhost:${port}/ws`, [
      `resqauth-${signToken(userId)}`,
    ]);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });

const waitForMessage = (ws, predicate, timeoutMs = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timed out waiting for WS message")),
      timeoutMs,
    );
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (predicate(msg)) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });

describe("Raw WebSocket hub", () => {
  test("denies anonymous sockets from joining claim rooms", async () => {
    const port = server.address().port;
    const anon = new WebSocket(`ws://localhost:${port}/ws`);
    await new Promise((r, j) => {
      anon.on("open", r);
      anon.on("error", j);
    });

    anon.send(JSON.stringify({ type: "joinPickup", claimId: "abc123" }));

    const denied = await waitForMessage(anon, (m) => m.type === "joinDenied");
    expect(denied.claimId).toBe("abc123");
    anon.close();
  });

  test("delivers chat frames in real-time to participants of the room", async () => {
    const donor = await User.create({
      name: "Donor",
      email: "donor@test.com",
      password: "password123",
      role: "donor",
      phone: "123",
      location: { type: "Point", coordinates: [88.36, 22.57] },
      isVerified: true,
    });
    const ngo = await User.create({
      name: "NGO",
      email: "ngo@test.com",
      password: "password123",
      role: "ngo",
      phone: "456",
      location: { type: "Point", coordinates: [88.36, 22.57] },
      isVerified: true,
    });

    const donation = await Donation.create({
      donor_id: donor._id,
      food_title: "Biryani",
      quantity: "Serves 10",
      expiry_datetime: new Date(Date.now() + 60 * 60 * 1000),
      status: "available",
      location: { type: "Point", coordinates: [88.36, 22.57], address: "Kolkata" },
    });

    const claim = await Claim.create({
      donation_id: donation._id,
      receiver_id: ngo._id,
      status: "accepted",
    });

    const donorWs = await connectSocket(donor._id);
    const ngoWs = await connectSocket(ngo._id);

    // Both participants join the room
    donorWs.send(JSON.stringify({ type: "joinPickup", claimId: String(claim._id) }));
    ngoWs.send(JSON.stringify({ type: "joinPickup", claimId: String(claim._id) }));

    await new Promise((r) => setTimeout(r, 300));

    const donorGetsMessage = waitForMessage(
      donorWs,
      (m) => m.type === "chat" && m.data?.sender_id === String(ngo._id),
    );

    // Simulate NGO sending a chat message (as the REST handler does)
    hub.notifyClaim(claim._id, {
      type: "chat",
      data: {
        _id: "msg-1",
        claim_id: String(claim._id),
        sender_id: String(ngo._id),
        sender_name: ngo.name,
        body: "On my way!",
      },
    });

    const received = await donorGetsMessage;
    expect(received.data.body).toBe("On my way!");

    // And a notification should be creatable + pushed to the donor over WS
    const notificationPromise = waitForMessage(
      donorWs,
      (m) => m.type === "notification" && m.notification?.type === "chat",
    );
    await Notification.create({
      recipient: donor._id,
      sender: ngo._id,
      type: "chat",
      title: "New message",
      message: "On my way!",
      link: "/my-claims",
      relatedId: claim._id,
      data: { claimId: claim._id },
    });
    hub.notifyUser(donor._id, {
      type: "notification",
      notification: {
        _id: "n-1",
        type: "chat",
        title: "New message",
        message: "On my way!",
        link: "/my-claims",
        relatedId: claim._id,
        read: false,
        createdAt: new Date().toISOString(),
      },
    });

    const notif = await notificationPromise;
    expect(notif.notification.title).toBe("New message");

    donorWs.close();
    ngoWs.close();
  });
});
