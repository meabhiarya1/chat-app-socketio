const express = require("express");
const app = express();
const port = 4000;
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

app.use(cors({ origin: "*" }));

const server = http.createServer(app);

const users = {};
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
console.log(users);

io.on("connection", (socket) => {
  console.log("User connected");
  socket.on("join", (username) => {
    users[username] = socket.id;
    console.log(users);
    io.emit("userlist", Object.keys(users));
  });

  socket.on("privatemessage", ({ sender, recipent, message }) => {
    const recipentSocketId = users[recipent];
    console.log("Recipient Socket ID:", recipentSocketId);
    

    if (recipentSocketId) {
      // io.emit("recieveprivatemessage", { sender, message, recipent });
      // console.log(
      //   `✅ Message sent to ${recipent} (${recipentSocketId}): ${message}`
      // );
      io.to(recipentSocketId).emit("recieveprivatemessage", {
        sender,
        message,
      });
      io.to(socket.id).emit("recieveprivatemessage", {
        sender: "You",
        message,
      }); // Show message to sender
      console.log(
        `✅ Message sent to ${recipent} (${recipentSocketId}): ${message}`
      );
    } else {
      console.log(`Recipient ${recipent} not found.`);
    }
  });
  // Group Broadcasting
  socket.on("groupmessage", ({ sender, message }) => {
    io.emit("recievemessage", { sender, message }); // Send to all users
  });

  socket.on("disconnect", () => {
    for (let username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        break;
      }
    }

    io.emit("userlist", Object.keys(users));
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
