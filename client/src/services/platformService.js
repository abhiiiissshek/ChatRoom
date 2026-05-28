import api, { SERVER_URL } from "./api";

export async function getStatuses(viewerId) {
  const { data } = await api.get("/statuses", { params: { viewerId } });
  return data || [];
}

export async function createStatus({ userId, text, file, privacy = "everyone", background = "#0f172a" }) {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("privacy", privacy);
  formData.append("background", background);
  if (text) formData.append("text", text);
  if (file) formData.append("file", file);

  const { data } = await api.post("/statuses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function markStatusSeen(statusId, userId) {
  const { data } = await api.post(`/statuses/${statusId}/seen`, { userId });
  return data;
}

export async function reactToStatus(statusId, userId, emoji) {
  const { data } = await api.post(`/statuses/${statusId}/react`, { userId, emoji });
  return data;
}

export async function replyToStatus(statusId, userId, text) {
  const { data } = await api.post(`/statuses/${statusId}/reply`, { userId, text });
  return data;
}

export async function createRoom({ createdBy, title = "Instant meeting", type = "temporary" }) {
  const { data } = await api.post("/rooms", { createdBy, title, type });
  return {
    ...data,
    inviteUrl: `${window.location.origin}?room=${data.inviteToken}`,
  };
}

export async function getRoomByInvite(token) {
  const { data } = await api.get(`/rooms/invite/${token}`);
  return data;
}

export async function endRoom(roomId) {
  const { data } = await api.patch(`/rooms/${roomId}/end`);
  return data;
}

export async function getGroups(uid) {
  const { data } = await api.get(`/groups/${uid}`);
  return data || [];
}

export async function createGroup(payload) {
  const { data } = await api.post("/groups", payload);
  return data;
}

export function roomInviteUrl(inviteToken) {
  return `${window.location.origin}?room=${inviteToken}`;
}

export { SERVER_URL };
