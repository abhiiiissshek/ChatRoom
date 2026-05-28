// src/App.jsx

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

import {
  auth,
  provider,
  fbSignInWithPopup,
  fbSignOut,
} from "./firebase";

import Login from "./pages/Login";
import Chat from "./pages/Chat";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // =========================
  // AUTH STATE
  // =========================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) {
        setUser(null);

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }

        return;
      }

      const u = {
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        username: (
          fbUser.displayName ||
          fbUser.email ||
          fbUser.uid
        )
          .toLowerCase()
          .replace(/\s+/g, ""),
      };

      setUser(u);

      // save user to backend
      try {
        await axios.post(
          `${SERVER_URL}/api/users/upsert`,
          u
        );
      } catch (err) {
        console.error("User upsert error:", err);
      }

      // connect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const s = io(SERVER_URL, {
        transports: ["websocket"],
        query: {
          userId: u.uid,
        },
        auth: {
          userId: u.uid,
        },
      });

      s.on("connect", () => {
        console.log("Socket connected:", s.id);
        s.emit("user_connected", u.uid);
      });

      socketRef.current = s;
      setSocket(s);
    });

    return () => {
      unsubscribe();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // =========================
  // GOOGLE LOGIN
  // =========================
  const handleSignIn = async () => {
    try {
      await fbSignInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await fbSignOut(auth);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setUser(null);
      setSocket(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // =========================
  // LOGIN SCREEN
  // =========================
  if (!user) {
    return <Login onSignIn={handleSignIn} />;
  }

  // =========================
  // CHAT SCREEN
  // =========================
  return (
    <Chat
      user={user}
      socket={socket}
      onSignOut={handleLogout}
    />
  );
}
