import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

// Move socket connection OUTSIDE the component to keep it persistent
const socket = io("http://localhost:4000", { autoConnect: false });

function App() {
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [recipent, setRecipent] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const userRef = useRef(null);

  useEffect(() => {
    socket.connect(); // Connect the socket when the component mounts

    socket.on("userlist", (users) => {
      console.log("Online users:", users);
      setUsers(users);
    });

    // Listen for private messages
    socket.on("recieveprivatemessage", ({ sender, message }) => {
      console.log(`📩 Received private message from ${sender}: ${message}`);
      setMessages((prev) => [...prev, { sender, message }]);
    });

    // Listen for group messages
    socket.on("recievemessage", ({ sender, message }) => {
      console.log(`📩 Received group message from ${sender}: ${message}`);
      setMessages((prev) => [...prev, { sender, message }]);
    });

    return () => {
      socket.disconnect(); // Clean up on unmount
    };
  }, []);

  const sendPrivateMessage = () => {
    console.log(`📤 Sending private message to ${recipent}: ${message}`);
    if (recipent && message) {
      socket.emit("privatemessage", { sender: userName, recipent, message });

      // Update UI immediately for the sender
      setMessages((prev) => [...prev, { sender: "You", message }]);
      setMessage("");
    }
  };

  const handleJoin = () => {
    const user = userRef.current.value;
    if (user) {
      setUserName(user);
      socket.emit("join", user);
    }
  };

  const sendGroupMessage = () => {
    if (message) {
      socket.emit("groupmessage", { sender: userName, message });
      setMessages((prev) => [...prev, { sender: "You(Group)", message }]);
      setMessage("");
    }
  };

  return (
    <>
      <div>
        {!userName ? (
          <div>
            <input type="text" placeholder="Enter username" ref={userRef} />
            <button onClick={handleJoin}>Join</button>
          </div>
        ) : (
          <div>
            <h3>Welcome, {userName}</h3>
            <h4>Online Users:</h4>
            <ul>
              {users
                .filter((user) => user !== userName)
                .map((user) => (
                  <li key={user}>{user}</li>
                ))}
            </ul>

            <h4>Send Private Message</h4>
            <select onChange={(e) => setRecipent(e.target.value)}>
              <option value="">Select recipient</option>
              {users
                .filter((user) => user !== userName)
                .map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
            </select>

            <input
              type="text"
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendPrivateMessage}>Send Private Message</button>
            <button onClick={sendGroupMessage}>Send to Group</button>

            <h4>Chats</h4>
            <div>
              {messages.map(({ sender, message }, index) => (
                <p key={index}>
                  {sender} : {message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
