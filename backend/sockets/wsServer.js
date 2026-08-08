const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const Claim = require("../models/claim");
const Donation = require("../models/donation");

// In-memory room maps keyed by document IDs / user IDs
const userSockets = new Map(); // userId -> Set<ws>
const claimSockets = new Map(); // claimId -> Set<ws>

const hub = {
  start(server) {
    if (this.wss) return this.wss;

    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      ws.isAlive = true;

      // Resolve identity from JWT in the query string
      let userId = null;
      try {
        const url = new URL(req.url, "http://localhost");
        const token = url.searchParams.get("token");
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        }
      } catch (err) {
        console.warn("[ws] Invalid/expired token, connection is anonymous.");
      }

      ws.userId = userId;
      ws.claims = new Set();

      if (userId) {
        if (!userSockets.has(String(userId)))
          userSockets.set(String(userId), new Set());
        userSockets.get(String(userId)).add(ws);
      }

      console.log(`[ws] Connected (user=${userId || "anon"})`);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (raw) => {
        let msg;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }
        this.handleMessage(ws, msg);
      });

      ws.on("close", () => this.cleanup(ws));
      ws.on("error", () => this.cleanup(ws));
    });

    this.interval = setInterval(() => {
      [...(this.wss?.clients || [])].forEach((client) => {
        if (client.isAlive === false) return client.terminate();
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
    return this.wss;
  },

async handleMessage(ws, msg) {
    switch (msg.type) {

      case "joinPickup": {
        const allowed = await this.canAccessClaim(msg.claimId, ws.userId);
        if (!allowed) {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: "joinDenied", claimId: msg.claimId }));
          }
          return;
        }
        if (!claimSockets.has(String(msg.claimId)))
          claimSockets.set(String(msg.claimId), new Set());
        claimSockets.get(String(msg.claimId)).add(ws);
        ws.claims.add(String(msg.claimId));
        break;
      }
      case "leavePickup": {
        this.leaveClaim(ws, msg.claimId);
        break;
      }
      case "updateLocation": {
        if (!ws.claims?.has(String(msg.claimId))) return;
        const room = claimSockets.get(String(msg.claimId));
        if (!room) return;
        const payload = JSON.stringify({
          type: "ngoLocationMoved",
          coords: msg.coords,
        });
        room.forEach((sock) => {
          if (sock !== ws && sock.readyState === 1) sock.send(payload);
        });
        break;
      }
      default:
        // Chat messages are created (and broadcast) only via POST /api/chat/:claimId,
        // so no client-emitted chat frames are handled here.
        break;
    }
  },

  leaveClaim(ws, claimId) {
    const room = claimSockets.get(String(claimId));
    if (room) {
      room.delete(ws);
      if (room.size === 0) claimSockets.delete(String(claimId));
    }
    ws.claims?.delete(String(claimId));
  },

  async canAccessClaim(claimId, userId) {
    if (!claimId || !userId) return false;
    try {
      const claim = await Claim.findById(claimId);
      if (!claim) return false;
      if (String(claim.receiver_id) === String(userId)) return true;
      const donation = await Donation.findById(claim.donation_id);
      return !!donation && String(donation.donor_id) === String(userId);
    } catch {
      return false;
    }
  },

  cleanup(ws) {
    if (ws.userId) {
      const set = userSockets.get(String(ws.userId));
      if (set) {
        set.delete(ws);
        if (set.size === 0) userSockets.delete(String(ws.userId));
      }
    }
    if (ws.claims) {
      [...ws.claims].forEach((c) => {
        const room = claimSockets.get(c);
        if (room) {
          room.delete(ws);
          if (room.size === 0) claimSockets.delete(c);
        }
      });
      ws.claims.clear();
    }
  },

  notifyUser(userId, payload) {
    const json = JSON.stringify(payload);
    [...(userSockets.get(String(userId)) || [])].forEach((sock) => {
      if (sock.readyState === 1) sock.send(json);
    });
  },

  notifyClaim(claimId, payload) {
    const room = claimSockets.get(String(claimId));
    if (!room) return;
    const json = JSON.stringify(payload);
    room.forEach((sock) => {
      if (sock.readyState === 1) sock.send(json);
    });
  },

  stop() {
    if (!this.wss) return;
    clearInterval(this.interval);
    [...(this.wss.clients || [])].forEach((client) => {
      try {
        client.terminate();
      } catch {}
    });
    this.wss.close();
    this.wss = null;
    userSockets.clear();
    claimSockets.clear();
  },
};

module.exports = hub;