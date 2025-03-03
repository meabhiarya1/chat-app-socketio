import { useEffect, useRef, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
function App() {
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [recipent, setRecipent] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const userRef = useRef(null);
  const socket = io("http://localhost:4000");

  useEffect(() => {
    socket.on("userlist", (users) => {
      console.log(users);
      setUsers(users);
    });

    socket.on("recieveprivatemessage", ({ sender, message, recipent }) => {
      // console.log(`📩 Received message from ${sender}: ${message}`);

      if (recipent === userName) {
        setMessages((messages) => [...messages, { sender, message }]);
      }
    });
    socket.on("recievemessage", ({ sender, message }) => {
      console.log(`📩 Received message from ${sender}: ${message}`);

      setMessages((messages) => [...messages, { sender, message }]);
    });
    return () => {
      socket.off("userlist");
      socket.off("recievemessage");
      socket.off("recieveprivatemessage");
    };
  }, [userName]);

  const handleJoin = () => {
    const userName = userRef.current.value;
    if (userName) {
      setUserName(userName);
      socket.emit("join", userName);
    }
  };

  const sendPrivateMessage = () => {
    console.log(recipent, message);
    if (recipent && message) {
      socket.emit("privatemessage", { sender: userName, recipent, message });
      setMessages((prev) => [...prev, { sender: "You", message }]);
      setMessage("");
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
            <input
              type="text"
              placeholder="Enter your username"
              // value={userName}
              ref={userRef}
              // onChange={(e) => {
              //   setUserName(e.target.value);
              // }}
            />
            <button onClick={handleJoin}>Join</button>
          </div>
        ) : (
          <div>
            <h3>Welcome, {userName}</h3>
            <h4>Online Users : </h4>
            <ul>
              {users
                .filter((user) => user !== userName)
                .map((user) => (
                  <li key={user}>{user}</li>
                ))}
            </ul>
            <h4>Send Message</h4>
            <select onChange={(e) => setRecipent(e.target.value)}>
              <option value="">Select recipent</option>
              {users
                .filter((users) => users !== userName)
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
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <button onClick={sendPrivateMessage}>Send Message</button>
            <button onClick={sendGroupMessage}>send to group</button>
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
