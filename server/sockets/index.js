const { Server } = require("socket.io");

const initializeSocketIO = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket.IO Connected");

    // Example of listening to a custom event
    socket.on("example_event", (data) => {
      console.log("Received data:", data);
      // You can emit events back to the client
      socket.emit("response_event", { message: "Hello from server!" });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Socket.IO Disconnected");
    });
  });
};

const emitSocketEvent = (req, event, payload) => {
  req.app.get("io").emit(event, payload);
};

module.exports = { initializeSocketIO, emitSocketEvent };
