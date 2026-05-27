import React, { useState, useEffect } from "react";
import { auth, provider, fbSignInWithPopup, fbSignOut } from "./firebase";
import axios from "axios";
import io from "socket.io-client";
import Login from "./Login";
import Chat from "./Chat";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  // ⭐ FIX — logout handler
  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      localStorage.removeItem("user");
      setUser(null);

      if (socket) {
        socket.emit("user_disconnected", user?.uid);
        socket.disconnect();
        setSocket(null);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ⭐ THEME STATE
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // ⭐ Apply theme to <html data-theme="">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // APP LOAD — READ AUTH & CONNECT SOCKET
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const u = {
          uid: fbUser.uid,
          name: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          username:
            (fbUser.displayName ||
              fbUser.email ||
              fbUser.uid
            )
              .toLowerCase()
              .replace(/\s+/g, ""),
          bio: "Hey there! I am using Chat App.",
        };

        setUser(u);

        // UPSERT user to DB
        try {
          await axios.post(`${SERVER_URL}/api/users/upsert`, u);
        } catch (e) {
          console.error("upsert error:", e);
        }

        // ------ SOCKET.IO ------
        const s = io(SERVER_URL, {
          transports: ["websocket"],
          query: { userId: u.uid },
        });

        s.on("connect", () => {
          console.log("Socket connected:", s.id);
          s.emit("user_connected", u.uid);
        });

        // GLOBAL LISTENERS
        s.on("presence_update", (data) =>
          console.log("Presence:", data)
        );
        s.on("typing", (d) => console.log("typing", d));
        s.on("stop_typing", (d) => console.log("stop", d));
        s.on("message_delivered", (d) => console.log("del", d));
        s.on("message_seen", (d) => console.log("seen", d));
        s.on("message_deleted", (d) => console.log("deleted", d));
        s.on("message_reacted", (d) => console.log("reacted", d));

        setSocket(s);
      } else {
        setUser(null);
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // SIGN IN
  const handleSignIn = async () => {
    try {
      await fbSignInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  // SHOW LOGIN PAGE
  if (!user) return <Login onSignIn={handleSignIn} />;

  // SHOW CHAT PAGE
  return (
    <Chat
      user={user}
      socket={socket}
      onSignOut={handleSignOut}  // FIXED
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}
