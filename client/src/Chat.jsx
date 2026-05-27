// src/Chat.jsx — Final Futuristic + Cozy + Particles + Emoji Bar + Voice + AI Suggestions
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ParticleBackground from "./components/ParticleBackground";
import VoiceRecorder from "./components/VoiceRecorder";
import "./Styles.css";


const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

// time helpers
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDateGroup(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ultra emoji list 100+ 
const EMOJIS = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊",
  "😋","😎","😍","😘","🥰","😗","😙","😚","🙂","🤗",
  "🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥",
  "😮","🤐","😯","😪","😴","😌","😛","😜","😝","🤤",
  "😒","😓","😔","😕","🙁","☹️","😖","😫","😩","🥺",
  "😢","😭","😤","😠","😡","🤬","😱","😨","😰","😥",
  "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👏","🙌",
  "🙏","🤝","👊","✊","🤏","🫶","🫰","🫵","🖐️","💪",
  "🔥","💯","✨","🎉","🎊","💥","🌟","⚡","💫","🌀",
  "❤️","💛","💚","💙","💜","🖤","🤍","🤎","💖","💘",
  "🍕","🍔","🍟","🍩","🍭","🍫","🍦","🍪","🍒","🍉",
  "🐶","🐱","🐼","🦁","🐻","🐵","🐧","🐤","🐸","🐢"
];

export default function Chat({ user, socket, onSignOut }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [popupVisible, setPopupVisible] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const messagesRef = useRef(null);
  const typingTimeout = useRef(null);

  // load recents
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/conversations/${user.uid}`);
      setConversations(res.data || []);
    } catch (err) {
      console.error("load convos error", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user.uid]);

  const doSearch = async () => {
    if (!search.trim()) return setResults([]);
    try {
      const res = await axios.get(`${SERVER_URL}/api/users?search=${encodeURIComponent(search)}`);
      setResults(res.data.filter(u => u.uid !== user.uid));
    } catch (err) {
      console.error("search error", err);
    }
  };

  const openChat = (other) => {
    setActiveChat(other);
    setMessages([]);
    setReplyTo(null);
    axios
      .get(`${SERVER_URL}/api/messages/${user.uid}/${other.uid}`)
      .then(r => {
        setMessages(r.data || []);
        setTimeout(scrollToBottom, 80);
      })
      .catch(err => console.error(err));

    // reset unread
    setConversations(prev => prev.map(c =>
      c.participant.uid === other.uid ? { ...c, unreadCount: 0 } : c
    ));
  };
  // SOCKET listeners
  useEffect(() => {
    if (!socket) return;

    const presenceHandler = ({ userId, isOnline, lastSeen }) => {
      setPresence(p => ({ ...p, [userId]: { isOnline, lastSeen } }));
      setConversations(prev =>
        prev.map(c =>
          c.participant.uid === userId
            ? { ...c, participant: { ...c.participant, isOnline, lastSeen } }
            : c
        )
      );
    };

    const msgHandler = (msg) => {
      // add message to active chat
      if (
        (msg.from === activeChat?.uid && msg.to === user.uid) ||
        (msg.from === user.uid && msg.to === activeChat?.uid)
      ) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }

      // update recents
      setConversations(prev => {
        const other = msg.from === user.uid ? msg.to : msg.from;
        const existing = prev.find(c => c.participant.uid === other);

        const updated = {
          participant: existing
            ? existing.participant
            : { uid: other, name: "User", photoURL: "" },
          lastMessage: msg.text || (msg.mediaUrl ? "[media]" : ""),
          lastAt: msg.createdAt,
          unreadCount: (existing ? existing.unreadCount : 0) + (msg.to === user.uid ? 1 : 0)
        };

        const rest = prev.filter(c => c.participant.uid !== other);
        return [updated, ...rest];
      });
    };

    socket.on("presence_update", presenceHandler);
    socket.on("private_message", msgHandler);
    socket.on("message_sent", msgHandler);

    socket.on("message_delivered", ({ messageId }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: "delivered" } : m))
    );
    socket.on("message_seen", ({ messageId }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: "seen" } : m))
    );
    socket.on("message_deleted", ({ messageId }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true } : m))
    );
    socket.on("message_reacted", ({ messageId, reactions }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m))
    );

    socket.on("typing", ({ from }) => {
      if (from === activeChat?.uid) setIsTyping(true);
    });
    socket.on("stop_typing", ({ from }) => {
      if (from === activeChat?.uid) setIsTyping(false);
    });

    return () => {
      socket.off("presence_update", presenceHandler);
      socket.off("private_message", msgHandler);
      socket.off("message_sent", msgHandler);
      socket.off("message_delivered");
      socket.off("message_seen");
      socket.off("message_deleted");
      socket.off("message_reacted");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [socket, activeChat, user.uid]);


  // SEND MESSAGE
  const sendMessage = () => {
    if (!text.trim() || !activeChat) return;

    socket.emit("private_message", {
      from: user.uid,
      to: activeChat.uid,
      text: text.trim(),
      replyToId: replyTo?._id || null,
      replyToText: replyTo
        ? (replyTo.text || (replyTo.mediaUrl ? "[media]" : ""))
        : null
    });

    setText("");
    setReplyTo(null);
  };


  // TYPING
  const handleTyping = (val) => {
    setText(val);

    if (!activeChat) return;

    socket.emit("typing", { from: user.uid, to: activeChat.uid });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { from: user.uid, to: activeChat.uid });
    }, 1200);
  };


  // mark seen
  const markSeen = (mid) => {
    socket.emit("message_seen", { messageId: mid, uid: user.uid });
  };


  // delete
  const deleteMessage = (mid) => {
    socket.emit("delete_message", { messageId: mid, uid: user.uid });
  };

  // react
  const reactTo = (mid, emoji) => {
    socket.emit("react_to_message", { messageId: mid, emoji, uid: user.uid });
  };


  // upload media
  const uploadMedia = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await axios.post(`${SERVER_URL}/api/messages/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      socket.emit("private_message", {
        from: user.uid,
        to: activeChat.uid,
        mediaUrl: res.data.url,
        mediaType: res.data.mediaType
      });

    } catch (err) {
      console.error("upload error", err);
    }
  };

  // voice recorder callback
  const handleVoiceSend = async ({ blob }) => {
  if (!activeChat) return;

  const fd = new FormData();
  fd.append("file", blob, "voice.webm");

  try {
    const res = await axios.post(
      `${SERVER_URL}/api/messages/upload`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    socket.emit("private_message", {
      from: user.uid,
      to: activeChat.uid,
      mediaUrl: res.data.url,
      mediaType: "audio/webm",
    });
  } catch (err) {
    console.error("Voice upload error:", err);
  }
};



  // AI Quick Replies
  const fetchAISuggestions = async () => {
    if (!activeChat) return;
    try {
      const res = await axios.post(`${SERVER_URL}/api/ai/suggest`, {
        messages: messages.slice(-10)
      });
      setAiSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error("AI suggest error", err);
    }
  };

  useEffect(() => {
    setAiSuggestions([]);
    const t = setTimeout(() => {
      if (activeChat) fetchAISuggestions();
    }, 600);
    return () => clearTimeout(t);
  }, [activeChat, messages.length]);


  // SCROLL
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 80);
  };


  // group messages by date
  const grouped = messages.reduce((acc, m) => {
    const key = fmtDateGroup(m.createdAt);
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  const unreadTotal = conversations.reduce(
    (s, c) => s + (c.unreadCount || 0), 0
  );
  return (
    <div className="chat-shell">
      <ParticleBackground intensity={0.7} />
      <div className="holo-orb-glow" aria-hidden />

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="me">
          <img src={user.photoURL} className="avatar" alt="" />
          <div className="me-meta">
            <div className="name">{user.name}</div>
            <div className="username">@{user.username}</div>
          </div>
        
        <button className="theme-btn" onClick={() => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
}}>
  🌓
</button>


          <button className="logout" onClick={onSignOut}>Logout</button>
        </div>

        {/* SEARCH */}
        <div className="search-area">
          <input
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="search-actions">
            <button onClick={doSearch}>Search</button>
            <button onClick={loadConversations}>Refresh</button>
          </div>
        </div>

        {/* RECENTS */}
        <div className="recent-header">
          <strong>Recent</strong>
          <div className="badge">{unreadTotal || ""}</div>
        </div>

        <div className="recent-list">
          {conversations.map((c) => {
            const p = c.participant;
            return (
              <div
                key={p.uid}
                className={`recent-item ${activeChat?.uid === p.uid ? "active" : ""}`}
                onClick={() => openChat(p)}
              >
                <div className="avatar-wrap">
                  <img src={p.photoURL} className="avatar-sm" alt="" />
                  <div className={`dot ${p.isOnline ? "online" : ""}`} />
                </div>

                <div className="meta">
                  <div className="meta-top">
                    <strong>{p.name}</strong>
                    <span className="meta-time">{fmtTime(c.lastAt)}</span>
                  </div>
                  <div className="meta-bottom">
                    <div className="preview">{c.lastMessage}</div>
                    {c.unreadCount > 0 && (
                      <div className="unread">{c.unreadCount}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SEARCH RESULTS */}
        {results.length > 0 && (
          <>
            <hr />
            <div className="results">
              {results.map((r) => (
                <div key={r.uid} className="result" onClick={() => openChat(r)}>
                  <img src={r.photoURL} className="avatar-sm" alt="" />
                  <div>
                    <strong>{r.name}</strong>
                    <div className="username">@{r.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* CHAT AREA */}
      <main className="chat-area">
        {!activeChat ? (
          <div className="empty-screen">Select a chat to start messaging</div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <header className="chat-header">
              <img src={activeChat.photoURL} className="avatar" alt="" />
              <div className="header-meta">
                <div className="title">{activeChat.name}</div>
                <div className="sub">
                  <span
                    className={`presence ${
                      presence[activeChat.uid]?.isOnline ? "online" : ""
                    }`}
                  />
                  {presence[activeChat.uid]?.isOnline
                    ? "Online"
                    : presence[activeChat.uid]?.lastSeen
                    ? `Last seen ${fmtTime(presence[activeChat.uid].lastSeen)}`
                    : ""}

                  {isTyping && <span className="typing-inline"> • typing...</span>}
                </div>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="messages" ref={messagesRef}>
              {Object.keys(grouped).map((groupKey) => (
                <div key={groupKey} className="date-group">
                  <div className="date-label">{groupKey}</div>

                  {grouped[groupKey].map((m) => {
                    const isMe = m.from === user.uid;
                    return (
                      <div
                        key={m._id}
                        className={`message-row ${isMe ? "me" : "them"}`}
                        onMouseEnter={() => markSeen(m._id)}
                      >
                        <div
                          className={`bubble ${isMe ? "bubble-me" : "bubble-them"}`}
                        >
                          {m.replyToText && (
                            <div className="reply-quote">{m.replyToText}</div>
                          )}

                          {/* MEDIA — hide if deleted */}
{!m.deleted && m.mediaUrl && m.mediaType?.startsWith("image") && (
  <img src={m.mediaUrl} className="media-preview" alt="media" />
)}

{/* TEXT */}
<div className={m.deleted ? "deleted" : ""}>
  {m.deleted ? <i>Message removed</i> : m.text}
</div>

{/* REACTIONS — hide if deleted */}
{!m.deleted && m.reactions?.length > 0 && (
  <div className="reactions">
    {m.reactions.map((r, i) => (
      <span key={i}>{r.emoji}</span>
    ))}
  </div>
)}


                          {m.reactions?.length > 0 && (
                            <div className="reactions">
                              {m.reactions.map((r, i) => (
                                <span key={i}>{r.emoji}</span>
                              ))}
                            </div>
                          )}

                          <div className="msg-time">
                            {fmtTime(m.createdAt)}
                            {isMe &&
                              (m.status === "seen"
                                ? " ✓✓"
                                : m.status === "delivered"
                                ? " ✓✓"
                                : " ✓")}
                          </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="msg-actions">
                          <button
                            title="Reply"
                            onClick={() => setReplyTo(m)}
                          >
                            ↩
                          </button>
                          <button
                            title="React"
                            onClick={() => setPopupVisible(m._id)}
                          >
                            😊
                          </button>
                          {isMe && (
                            <button
                              title="Delete"
                              onClick={() => deleteMessage(m._id)}
                            >
                              🗑
                            </button>
                          )}

                          {popupVisible === m._id && (
                            <div className="popup">
                              {["👍", "❤️", "😂", "😮", "😢", "🔥", "✨", "💯"].map(
                                (e) => (
                                  <button
                                    key={e}
                                    onClick={() => {
                                      reactTo(m._id, e);
                                      setPopupVisible(null);
                                    }}
                                  >
                                    {e}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* REPLYING BAR */}
            {replyTo && (
              <div className="replying-bar">
                Replying:{" "}
                <strong>{replyTo.text || "[media]"}</strong>
                <button onClick={() => setReplyTo(null)}>✕</button>
              </div>
            )}

            {/* AI QUICK REPLIES */}
            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    className="ai-chip"
                    onClick={() => setText(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* COMPOSER */}
            <div className="composer">
              <div className="left-controls">
                <label className="attach">
                  📎
                  <input
                    type="file"
                    onChange={(e) => uploadMedia(e.target.files[0])}
                  />
                </label>

                {/* Voice Recorder Button */}
                <VoiceRecorder
                  from={user.uid}
                  to={activeChat.uid}
                  socket={socket}
                  onSend={handleVoiceSend}
                />

                {/* Emoji toggle */}
                <button
                  className="emoji-toggle"
                  onClick={() => setEmojiOpen((v) => !v)}
                >
                  😊
                </button>
              </div>

              {/* EMOJI PANEL */}
              {emojiOpen && (
                <div className="emoji-panel">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setText((t) => t + e);
                        setEmojiOpen(false);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              <input
                className="composer-input"
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
              />

              <button className="send-btn" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


