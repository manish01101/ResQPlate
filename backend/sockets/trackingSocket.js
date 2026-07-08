const { Server } = require("socket.io");

const setupSockets = (server, corsOptions) => {
  const io = new Server(server, { cors: corsOptions });

  io.on("connection", (socket) => {
    console.log("User connected to socket:", socket.id);

    // Join a room unique to the specific Claim ID
    socket.on("joinPickup", (claimId) => {
      socket.join(claimId);
      console.log(`Socket ${socket.id} joined pickup room: ${claimId}`);
    });

    // NGO emits this when they move. We broadcast it to the Donor.
    socket.on("updateLocation", (data) => {
      socket.to(data.claimId).emit("ngoLocationMoved", data.coords);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = setupSockets;
