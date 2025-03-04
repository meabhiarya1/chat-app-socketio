const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const port = 8000;
app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const users = {}; // { username: socketId }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    users[username] = socket.id;
    console.log("Users List:", users);
    io.emit("userlist", Object.keys(users)); // Broadcast user list
  });

  socket.on("privatemessage", ({ sender, recipent, message }) => {
    const recipentSocketId = users[recipent];

    console.log(
      `📤 ${sender} -> ${recipent}: ${message} (Socket: ${recipentSocketId})`
    );

    if (recipentSocketId && socket.id !== recipentSocketId) {
      // Send message only to recipient
      io.to(recipentSocketId).emit("recieveprivatemessage", {
        sender,
        message,
      });

      console.log(`✅ Message delivered to ${recipent}`);
    } else {
      console.log(`❌ Recipient ${recipent} not found.`);
    }
  });

  socket.on("groupmessage", ({ sender, message }) => {
    io.emit("recievemessage", { sender, message }); // Send to all
  });

  socket.on("disconnect", () => {
    for (let user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        break;
      }
    }
    io.emit("userlist", Object.keys(users)); // Update user list on disconnect
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
