import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import AIChips from "../components/chat/AIChips";
import ChatHeader from "../components/chat/ChatHeader";
import CallModal from "../components/chat/CallModal";
import Composer from "../components/chat/Composer";
import MessageList from "../components/chat/MessageList";
import Sidebar from "../components/chat/Sidebar";
import EmptyState from "../components/common/EmptyState";
import CreateGroupModal from "../components/groups/CreateGroupModal";
import AppShell from "../components/layout/AppShell";
import MeetingRoomModal from "../components/meetings/MeetingRoomModal";
import ProfileModal from "../components/profile/ProfileModal";
import CreateStatusModal from "../components/status/CreateStatusModal";
import StatusViewer from "../components/status/StatusViewer";
import useCall from "../hooks/useCall";
import useMeetingRoom from "../hooks/useMeetingRoom";
import api from "../services/api";
import {
  getConversations,
  getMessages,
  searchUsers,
  updateUserProfile,
  uploadMedia,
} from "../services/chatService";
import {
  createGroup,
  createRoom,
  createStatus,
  endRoom,
  getRoomByInvite,
  getStatuses,
  markStatusSeen,
  reactToStatus,
  replyToStatus,
} from "../services/platformService";

function readStoredList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function groupToConversation(group) {
  if (!group?._id) return null;

  return {
    kind: "group",
    group,
    participant: {
      uid: group._id,
      name: group.title,
      username: "group",
      photoURL: group.avatarUrl,
      isGroup: true,
      members: group.members,
      admins: group.admins,
      description: group.description,
      inviteToken: group.inviteToken,
    },
    lastMessage: group.lastMessage || "Group created",
    lastAt: group.updatedAt || group.createdAt || new Date().toISOString(),
    unreadCount: 0,
  };
}

export default function Chat({ user, socket, onSignOut }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [mutedChatIds, setMutedChatIds] = useState(() => readStoredList(`muted:${user.uid}`));
  const [pinnedChatIds, setPinnedChatIds] = useState(() => readStoredList(`pinned:${user.uid}`));
  const [archivedChatIds, setArchivedChatIds] = useState(() => readStoredList(`archived:${user.uid}`));
  const [blockedUserIds, setBlockedUserIds] = useState(() => readStoredList(`blocked:${user.uid}`));
  const [profileTarget, setProfileTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [statusComposerOpen, setStatusComposerOpen] = useState(false);
  const [statusViewerGroup, setStatusViewerGroup] = useState(null);
  const [groupComposerOpen, setGroupComposerOpen] = useState(false);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const callControls = useCall({ socket, user });
  const meetingControls = useMeetingRoom({ socket, user });
  const joinMeetingRoom = meetingControls.joinRoom;

  const statusGroups = useMemo(() => {
    const grouped = new Map();
    statuses.forEach((status) => {
      const author = status.author || { uid: status.userId, name: "User" };
      const current = grouped.get(author.uid) || { user: author, statuses: [] };
      current.statuses.push(status);
      grouped.set(author.uid, current);
    });

    return [...grouped.values()].sort((a, b) => {
      const aOwn = a.user.uid === user.uid;
      const bOwn = b.user.uid === user.uid;
      if (aOwn !== bOwn) return aOwn ? -1 : 1;
      return new Date(b.statuses.at(-1)?.createdAt || 0) - new Date(a.statuses.at(-1)?.createdAt || 0);
    });
  }, [statuses, user.uid]);

  useEffect(() => {
    localStorage.setItem(`muted:${user.uid}`, JSON.stringify(mutedChatIds));
  }, [mutedChatIds, user.uid]);

  useEffect(() => {
    localStorage.setItem(`pinned:${user.uid}`, JSON.stringify(pinnedChatIds));
  }, [pinnedChatIds, user.uid]);

  useEffect(() => {
    localStorage.setItem(`archived:${user.uid}`, JSON.stringify(archivedChatIds));
  }, [archivedChatIds, user.uid]);

  useEffect(() => {
    localStorage.setItem(`blocked:${user.uid}`, JSON.stringify(blockedUserIds));
  }, [blockedUserIds, user.uid]);

  const visibleConversations = useMemo(() => {
    return conversations
      .filter((item) => !archivedChatIds.includes(item.participant?.uid))
      .sort((a, b) => {
        const aPinned = pinnedChatIds.includes(a.participant?.uid);
        const bPinned = pinnedChatIds.includes(b.participant?.uid);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return new Date(b.lastAt || 0) - new Date(a.lastAt || 0);
      });
  }, [archivedChatIds, conversations, pinnedChatIds]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations(user.uid);

      const normalized = data.map((item) => {
        if (item.kind === "group" || item.participant?.isGroup) {
          return {
            ...item,
            participant: {
              ...item.participant,
              isGroup: true,
            },
          };
        }

        return item;
      });

      setConversations(normalized);
    } catch (error) {
      console.error("Load conversations error:", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadStatuses = useCallback(async () => {
    try {
      const data = await getStatuses(user.uid);
      setStatuses(data);
    } catch (error) {
      console.error("Load statuses error:", error);
    }
  }, [user.uid]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    if (!socket) return;

    const params = new URLSearchParams(window.location.search);
    const roomToken = params.get("room");
    if (!roomToken) return;

    getRoomByInvite(roomToken)
      .then((room) => joinMeetingRoom(room))
      .catch((error) => console.error("Join room error:", error));
  }, [joinMeetingRoom, socket]);

  useEffect(() => {
    if (!activeChat) return;

    async function loadThread() {
      try {
        setLoadingMessages(true);
        const data = activeChat.isGroup
          ? await getMessages(activeChat.uid, "group")
          : await getMessages(user.uid, activeChat.uid);
        setMessages(data);
      } catch (error) {
        console.error("Load messages error:", error);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadThread();
    setReplyTo(null);
    setIsTyping(false);
  }, [activeChat, user.uid]);

  useEffect(() => {
    const shouldAutoScroll =
      bottomRef.current &&
      bottomRef.current.getBoundingClientRect()
        .top <
      window.innerHeight + 200;

    if (shouldAutoScroll) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages.length, activeChat?.uid]);

  const updateMessage = useCallback((messageId, patch) => {
    setMessages((current) =>
      current.map((message) => (message._id === messageId ? { ...message, ...patch } : message))
    );
  }, []);

  const upsertStatus = useCallback((status) => {
    if (!status?._id) return;
    const expiresAt = status.expiresAt ? new Date(status.expiresAt).getTime() : Infinity;
    if (expiresAt <= Date.now()) return;

    setStatuses((current) => {
      const exists = current.some((item) => item._id === status._id);
      const next = exists
        ? current.map((item) => (item._id === status._id ? status : item))
        : [...current, status];
      return next.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    });
  }, []);

  const upsertGroupConversation = useCallback((conversation) => {
    if (!conversation?.participant?.uid) return;
    setConversations((current) => {
      const groupId = conversation.participant.uid;
      const existing = current.find((item) => item.participant?.uid === groupId || item.group?._id === groupId);
      const merged = {
        ...existing,
        ...conversation,
        unreadCount: existing?.unreadCount || conversation.unreadCount || 0,
      };
      return [merged, ...current.filter((item) => item.participant?.uid !== groupId && item.group?._id !== groupId)];
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const upsertConversation = (message) => {
      const otherUid = message.from === user.uid ? message.to : message.from;

      setConversations((current) => {
        const existing = current.find((item) => item.participant?.uid === otherUid);
        const participant =
          existing?.participant ||
          (activeChat?.uid === otherUid
            ? activeChat
            : { uid: otherUid, name: "User", photoURL: "", username: "user" });

        const updated = {
          participant,
          lastMessage: message.text || (message.mediaUrl ? "[media]" : ""),
          lastAt: message.createdAt || new Date().toISOString(),
          unreadCount:
            message.to === user.uid && activeChat?.uid !== otherUid
              ? (existing?.unreadCount || 0) + 1
              : existing?.unreadCount || 0,
        };

        return [updated, ...current.filter((item) => item.participant?.uid !== otherUid)];
      });
    };

    const handleMessage = (message) => {
      const belongsToOpenChat =
        (message.from === user.uid && message.to === activeChat?.uid) ||
        (message.from === activeChat?.uid && message.to === user.uid);

      if (belongsToOpenChat) {
        setMessages((current) => {
          if (current.some((item) => item._id === message._id)) return current;
          return [...current, message];
        });
      }

      upsertConversation(message);
    };

    const handleGroupMessage = ({ groupId, message }) => {
      if (activeChat?.isGroup && activeChat.uid === groupId) {
        setMessages((current) => {
          if (current.some((item) => item._id === message._id)) return current;
          return [...current, message];
        });
      }

      setConversations((current) =>
        current.map((item) =>
          item.group?._id === groupId || item.participant?.uid === groupId
            ? {
              ...item,
              lastMessage: message.text || (message.mediaUrl ? "[media]" : ""),
              lastAt: message.createdAt || new Date().toISOString(),
              unreadCount:
                message.from !== user.uid && activeChat?.uid !== groupId
                  ? (item.unreadCount || 0) + 1
                  : item.unreadCount || 0,
            }
            : item
        )
      );
    };

    const handleGroupCreated = ({ group, conversation }) => {
      const nextConversation = conversation || groupToConversation(group);
      upsertGroupConversation(nextConversation);
      socket.emit("group:join", { groupId: nextConversation?.participant?.uid });
    };

    const handleGroupUpdated = ({ group, conversation }) => {
      const nextConversation = conversation || groupToConversation(group);
      upsertGroupConversation(nextConversation);
      if (activeChat?.isGroup && activeChat.uid === nextConversation?.participant?.uid) {
        setActiveChat(nextConversation.participant);
      }
    };

    const handleGroupDeleted = ({ groupId }) => {
      setConversations((current) =>
        current.filter((item) => item.participant?.uid !== groupId && item.group?._id !== groupId)
      );
      if (activeChat?.isGroup && activeChat.uid === groupId) setActiveChat(null);
    };

    const handleStatusCreated = ({ status }) => upsertStatus(status);
    const handleStatusUpdated = ({ status }) => upsertStatus(status);

    const handlePresence = ({ userId, isOnline, lastSeen }) => {
      setPresence((current) => ({
        ...current,
        [userId]: { isOnline, lastSeen },
      }));

      setConversations((current) =>
        current.map((item) =>
          item.participant?.uid === userId
            ? {
              ...item,
              participant: {
                ...item.participant,
                isOnline,
                lastSeen,
              },
            }
            : item
        )
      );
    };

    socket.on("private_message", handleMessage);
    socket.on("group:message", handleGroupMessage);
    socket.on("group:created", handleGroupCreated);
    socket.on("group:updated", handleGroupUpdated);
    socket.on("group:deleted", handleGroupDeleted);
    socket.on("status:created", handleStatusCreated);
    socket.on("status:updated", handleStatusUpdated);
    socket.on("presence_update", handlePresence);
    socket.on("message_delivered", ({ messageId }) => updateMessage(messageId, { status: "delivered" }));
    socket.on("message_seen", ({ messageId }) => updateMessage(messageId, { status: "seen" }));
    socket.on("message_deleted", ({ messageId }) => updateMessage(messageId, { deleted: true }));
    socket.on("message_reacted", ({ messageId, reactions }) => updateMessage(messageId, { reactions }));
    socket.on("typing", ({ from }) => {
      if (from === activeChat?.uid) setIsTyping(true);
    });
    socket.on("stop_typing", ({ from }) => {
      if (from === activeChat?.uid) setIsTyping(false);
    });

    return () => {
      socket.off("private_message", handleMessage);
      socket.off("group:message", handleGroupMessage);
      socket.off("group:created", handleGroupCreated);
      socket.off("group:updated", handleGroupUpdated);
      socket.off("group:deleted", handleGroupDeleted);
      socket.off("status:created", handleStatusCreated);
      socket.off("status:updated", handleStatusUpdated);
      socket.off("presence_update", handlePresence);
      socket.off("message_delivered");
      socket.off("message_seen");
      socket.off("message_deleted");
      socket.off("message_reacted");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [socket, user.uid, activeChat, updateMessage, upsertGroupConversation, upsertStatus]);

  useEffect(() => {
    setAiSuggestions([]);
    if (!activeChat || messages.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post("/ai/suggest", {
          messages: messages.slice(-10),
        });
        setAiSuggestions(data?.suggestions || []);
      } catch {
        setAiSuggestions([]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activeChat, messages]);

  const handleSearch = useCallback(async () => {
    try {
      const data = await searchUsers(search);
      setResults(data.filter((item) => item.uid !== user.uid));
    } catch (error) {
      console.error("Search users error:", error);
    }
  }, [search, user.uid]);

  const handleSelectChat = useCallback((participant) => {
    setActiveChat(participant);
    if (participant.isGroup) socket?.emit("group:join", { groupId: participant.uid });
    setResults([]);
    setSearch("");
    setMessageSearch("");
    setMessageSearchOpen(false);

    setConversations((current) =>
      current.map((item) =>
        item.participant?.uid === participant.uid ? { ...item, unreadCount: 0 } : item
      )
    );
  }, [socket]);

  const handleTextChange = useCallback((value) => {
    setText(value);

    if (!socket || !activeChat) return;

    if (activeChat.isGroup) {
      socket.emit("group:typing", { from: user.uid, groupId: activeChat.uid });
    } else {
      socket.emit("typing", { from: user.uid, to: activeChat.uid });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (activeChat.isGroup) {
        socket.emit("group:stop_typing", { from: user.uid, groupId: activeChat.uid });
      } else {
        socket.emit("stop_typing", { from: user.uid, to: activeChat.uid });
      }
    }, 1000);
  }, [activeChat, socket, user.uid]);

  const sendMessage = useCallback(() => {
    if (!socket || !activeChat || !text.trim()) return;
    if (!activeChat.isGroup && blockedUserIds.includes(activeChat.uid)) {
      setNotice("You blocked this user");
      window.setTimeout(() => setNotice(""), 2500);
      return;
    }

    if (activeChat.isGroup) {
      socket.emit("group:message", {
        groupId: activeChat.uid,
        from: user.uid,
        text: text.trim(),
        mentions: [...text.matchAll(/@([a-z0-9_.-]+)/gi)].map((match) => match[1]),
        replyToId: replyTo?._id || null,
        replyToText: replyTo ? replyTo.text || (replyTo.mediaUrl ? "[media]" : "") : null,
      });

      setText("");
      setReplyTo(null);
      setAiSuggestions([]);
      return;
    }
    const optimisticMessage = {
      _id: crypto.randomUUID(),

      from: user.uid,
      to: activeChat.uid,

      text: text.trim(),

      createdAt: new Date().toISOString(),

      status: "sending",

      replyToId: replyTo?._id || null,

      replyToText: replyTo
        ? replyTo.text ||
        (replyTo.mediaUrl
          ? "[media]"
          : "")
        : null,
    };

    setMessages((current) => [
      ...current,
      optimisticMessage,
    ]);
    socket.emit("private_message", {
      from: user.uid,
      to: activeChat.uid,
      text: text.trim(),
      replyToId: replyTo?._id || null,
      replyToText: replyTo ? replyTo.text || (replyTo.mediaUrl ? "[media]" : "") : null,
    });

    setText("");
    setReplyTo(null);
    setAiSuggestions([]);
  }, [activeChat, blockedUserIds, replyTo, socket, text, user.uid]);

  const handleUpload = useCallback(async (file) => {
    if (!socket || !activeChat || !file) return;
    if (!activeChat.isGroup && blockedUserIds.includes(activeChat.uid)) {
      setNotice("You blocked this user");
      window.setTimeout(() => setNotice(""), 2500);
      return;
    }

    try {
      const uploaded = await uploadMedia(file);
      if (activeChat.isGroup) {
        socket.emit("group:message", {
          groupId: activeChat.uid,
          from: user.uid,
          mediaUrl: uploaded.url,
          mediaType: uploaded.mediaType,
        });
        return;
      }

      socket.emit("private_message", {
        from: user.uid,
        to: activeChat.uid,
        mediaUrl: uploaded.url,
        mediaType: uploaded.mediaType,
      });
    } catch (error) {
      console.error("Upload media error:", error);
    }
  }, [activeChat, blockedUserIds, socket, user.uid]);

  const handleVoiceSend = useCallback(async ({ blob }) => {
    const file = new File([blob], "voice.webm", { type: "audio/webm" });
    await handleUpload(file);
  }, [handleUpload]);

  const handleSeen = useCallback((messageId) => {
    if (!socket || !messageId) return;
    socket.emit("message_seen", { messageId, uid: user.uid });
  }, [socket, user.uid]);

  const handleDelete = useCallback((messageId) => {
    if (!socket || !messageId) return;
    socket.emit("delete_message", { messageId, uid: user.uid });
  }, [socket, user.uid]);

  const handleReact = useCallback((messageId, emoji) => {
    if (!socket || !messageId) return;
    socket.emit("react_to_message", { messageId, emoji, uid: user.uid });
  }, [socket, user.uid]);

  const handleMenuAction = useCallback((action, participant) => {
    if (!participant) return;

    const actionLabels = {
      profile: "Profile opened",
      mute: mutedChatIds.includes(participant.uid) ? "Chat unmuted" : "Chat muted",
      pin: pinnedChatIds.includes(participant.uid) ? "Chat unpinned" : "Chat pinned",
      archive: archivedChatIds.includes(participant.uid) ? "Chat unarchived" : "Chat archived",
      search: "Search messages enabled",
      export: "Chat history exported",
      clear: "Chat cleared locally",
      delete: "Chat deleted locally",
      block: blockedUserIds.includes(participant.uid) ? "User unblocked" : "User blocked",
      report: "Report noted",
    };

    if (action === "profile") {
      setProfileTarget(participant);
      return;
    }

    if (action === "mute") {
      setMutedChatIds((current) =>
        current.includes(participant.uid)
          ? current.filter((uid) => uid !== participant.uid)
          : [...current, participant.uid]
      );
    }

    if (action === "pin") {
      setPinnedChatIds((current) =>
        current.includes(participant.uid)
          ? current.filter((uid) => uid !== participant.uid)
          : [...current, participant.uid]
      );
    }

    if (action === "archive") {
      setArchivedChatIds((current) =>
        current.includes(participant.uid)
          ? current.filter((uid) => uid !== participant.uid)
          : [...current, participant.uid]
      );
      if (!archivedChatIds.includes(participant.uid)) setActiveChat(null);
    }

    if (action === "search") {
      setMessageSearchOpen(true);
      setNotice("");
      return;
    }

    if (action === "clear") {
      setMessages([]);
    }

    if (action === "export") {
      const lines = messages.map((message) => {
        const sender = message.from === user.uid ? user.name || "You" : participant.name || "User";
        const content = message.deleted ? "[deleted]" : message.text || message.mediaUrl || "";
        return `[${message.createdAt || ""}] ${sender}: ${content}`;
      });
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${participant.username || participant.uid}-chat.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    if (action === "delete") {
      setConversations((current) => current.filter((item) => item.participant?.uid !== participant.uid));
      setActiveChat(null);
    }

    if (action === "block") {
      setBlockedUserIds((current) =>
        current.includes(participant.uid)
          ? current.filter((uid) => uid !== participant.uid)
          : [...current, participant.uid]
      );
    }

    setNotice(actionLabels[action] || "Action completed");
    window.setTimeout(() => setNotice(""), 2500);
  }, [archivedChatIds, blockedUserIds, messages, mutedChatIds, pinnedChatIds, user.name, user.uid]);

  const handleSaveProfile = useCallback(async (draft) => {
    try {
      const saved = await updateUserProfile(user.uid, draft);
      setProfileTarget(saved);
      setNotice("Profile updated");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (error) {
      console.error("Profile update error:", error);
      setNotice("Profile update failed");
      window.setTimeout(() => setNotice(""), 2500);
    }
  }, [user.uid]);

  const handleCreateStatus = useCallback(async (draft) => {
    try {
      const status = await createStatus({ ...draft, userId: user.uid });
      upsertStatus(status);
    } catch (error) {
      console.error("Create status error:", error);
      setNotice("Status could not be shared");
      window.setTimeout(() => setNotice(""), 2500);
    }
  }, [upsertStatus, user.uid]);

  const handleStatusSeen = useCallback(async (statusId) => {
    try {
      const status = await markStatusSeen(statusId, user.uid);
      upsertStatus(status);
      setStatuses((current) =>
        current.map((status) =>
          status._id === statusId && !status.seenBy?.some((seen) => seen.userId === user.uid)
            ? { ...status, seenBy: [...(status.seenBy || []), { userId: user.uid, seenAt: new Date().toISOString() }] }
            : status
        )
      );
    } catch (error) {
      console.error("Mark status seen error:", error);
    }
  }, [upsertStatus, user.uid]);

  const handleStatusReaction = useCallback(async (statusId, emoji) => {
    try {
      const status = await reactToStatus(statusId, user.uid, emoji);
      upsertStatus(status);
      setNotice("Reaction sent");
      window.setTimeout(() => setNotice(""), 1800);
    } catch (error) {
      console.error("React status error:", error);
    }
  }, [upsertStatus, user.uid]);

  const handleStatusReply = useCallback(async (statusId, replyText) => {
    try {
      const status = await replyToStatus(statusId, user.uid, replyText);
      upsertStatus(status);
      setNotice("Reply sent");
      window.setTimeout(() => setNotice(""), 1800);
    } catch (error) {
      console.error("Reply status error:", error);
    }
  }, [upsertStatus, user.uid]);

  const handleCreateGroup = useCallback(async (draft) => {
    try {
      const createdGroup = await createGroup({
        ...draft,
        createdBy: user.uid,
      });

      const conversation = groupToConversation(createdGroup);

      upsertGroupConversation(conversation);

      setActiveChat(conversation.participant);

      socket?.emit("group:join", {
        groupId: conversation.participant.uid,
      });

    } catch (error) {
      console.error("Create group error:", error);

      setNotice("Group could not be created");

      window.setTimeout(() => setNotice(""), 2500);
    }
  }, [socket, upsertGroupConversation, user.uid]);

  const handleCreateMeeting = useCallback(async () => {
    try {
      const room = await createRoom({ createdBy: user.uid, title: `${user.name || "Team"} meeting` });
      await navigator.clipboard?.writeText(room.inviteUrl);
      joinMeetingRoom(room);
    } catch (error) {
      console.error("Create meeting error:", error);
      setNotice("Meeting could not be created");
      window.setTimeout(() => setNotice(""), 2500);
    }
  }, [joinMeetingRoom, user.name, user.uid]);

  const handleEndMeeting = useCallback(async () => {
    try {
      if (meetingControls.meeting.room?.roomId) {
        await endRoom(meetingControls.meeting.room.roomId);
      }
    } catch (error) {
      console.error("End meeting error:", error);
    } finally {
      meetingControls.leaveRoom();
    }
  }, [meetingControls]);

  return (
    <AppShell>
      <div className="mx-auto flex h-full min-h-0 max-w-[1500px] overflow-hidden border-x border-white/10 bg-zinc-950/50 shadow-2xl shadow-black/30">
        <div className={clsx("h-full w-full md:block md:w-auto", activeChat && "hidden")}>
          <Sidebar
            user={user}
            conversations={visibleConversations}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            search={search}
            setSearch={setSearch}
            doSearch={handleSearch}
            results={results}
            onSignOut={onSignOut}
            onRefresh={loadConversations}
            loading={loadingConversations}
            pinnedChatIds={pinnedChatIds}
            mutedChatIds={mutedChatIds}
            archivedCount={archivedChatIds.length}
            onOpenProfile={() => setProfileTarget(user)}
            statusGroups={statusGroups}
            onCreateStatus={() => setStatusComposerOpen(true)}
            onOpenStatus={setStatusViewerGroup}
            onCreateGroup={() => setGroupComposerOpen(true)}
            onCreateMeeting={handleCreateMeeting}
          />
        </div>

        <main className={clsx("h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0d0f13]/80", activeChat ? "flex" : "hidden md:flex")}>
          {!activeChat ? (
            <EmptyState
              icon={<MessageCircle size={28} />}
              title="Select a conversation"
              description="Your messages, media, replies, and presence updates will appear here."
            />
          ) : (
            <>
              <ChatHeader
                activeChat={activeChat}
                presence={presence}
                isTyping={isTyping}
                onBack={() => setActiveChat(null)}
                onMenuAction={handleMenuAction}
                onStartVoiceCall={() => !activeChat.isGroup && callControls.startCall(activeChat, "voice")}
                onStartVideoCall={() => !activeChat.isGroup && callControls.startCall(activeChat, "video")}
                menuState={{
                  muted: mutedChatIds.includes(activeChat.uid),
                  pinned: pinnedChatIds.includes(activeChat.uid),
                  archived: archivedChatIds.includes(activeChat.uid),
                }}
              />

              {(messageSearchOpen || notice) && (
                <div className="shrink-0 border-b border-white/10 bg-slate-950/55 px-4 py-3">
                  {messageSearchOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        autoFocus
                        placeholder="Search this conversation"
                        className="h-10 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
                      />
                      <button
                        onClick={() => {
                          setMessageSearch("");
                          setMessageSearchOpen(false);
                        }}
                        className="rounded-2xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">{notice}</p>
                  )}
                </div>
              )}

              {loadingMessages ? (
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-500">Loading conversation...</div>
              ) : (
                <MessageList
                  messages={messages}
                  user={user}
                  bottomRef={bottomRef}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onSeen={handleSeen}
                  searchQuery={messageSearch}
                />
              )}

              <AIChips suggestions={aiSuggestions} onSelect={setText} />

              <Composer
                text={text}
                onTextChange={handleTextChange}
                sendMessage={sendMessage}
                onUpload={handleUpload}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onVoiceSend={handleVoiceSend}
                disabled={!socket || (!activeChat.isGroup && blockedUserIds.includes(activeChat.uid))}
                blocked={!activeChat.isGroup && blockedUserIds.includes(activeChat.uid)}
              />
            </>
          )}
        </main>
      </div>

      <CallModal
        call={callControls.call}
        participant={callControls.call.peer || activeChat}
        localVideoRef={callControls.localVideoRef}
        remoteVideoRef={callControls.remoteVideoRef}
        onAccept={callControls.acceptCall}
        onReject={callControls.rejectCall}
        onEnd={callControls.endCall}
        onToggleMute={callControls.toggleMute}
        onToggleCamera={callControls.toggleCamera}
      />

      <ProfileModal
        open={Boolean(profileTarget)}
        profile={profileTarget}
        currentUser={user}
        isSelf={profileTarget?.uid === user.uid}
        onClose={() => setProfileTarget(null)}
        onSave={handleSaveProfile}
        sharedMediaCount={messages.filter((message) => message.mediaUrl).length}
        mutualChats={activeChat ? [activeChat.name || activeChat.username || "Current chat"] : []}
        blockedUsers={blockedUserIds}
      />

      <CreateStatusModal
        open={statusComposerOpen}
        onClose={() => setStatusComposerOpen(false)}
        onSubmit={handleCreateStatus}
      />

      <StatusViewer
        open={Boolean(statusViewerGroup)}
        group={statusViewerGroup}
        user={user}
        onClose={() => setStatusViewerGroup(null)}
        onSeen={handleStatusSeen}
        onReact={handleStatusReaction}
        onReply={handleStatusReply}
      />

      <CreateGroupModal
        open={groupComposerOpen}
        onClose={() => setGroupComposerOpen(false)}
        searchUsers={(query) =>
          searchUsers(query).then((data) =>
            data.filter((item) => item.uid !== user.uid)
          )
        }
        onCreate={handleCreateGroup}
        user={user}
      />

      <MeetingRoomModal
        socket={socket}
        meeting={meetingControls.meeting}
        user={user}
        localVideoRef={meetingControls.localVideoRef}
        onLeave={meetingControls.leaveRoom}
        onEnd={handleEndMeeting}
        onToggleMute={meetingControls.toggleMute}
        onToggleCamera={meetingControls.toggleCamera}
        onShareScreen={meetingControls.shareScreen}
        onSendChat={meetingControls.sendChat}
      />
    </AppShell>
  );
}
