import api from "./api";

export async function getConversations(uid) {
  const { data } = await api.get(`/conversations/${uid}`);
  return data || [];
}

export async function getMessages(userId, participantId) {
  const { data } = await api.get(`/messages/${userId}/${participantId}`);
  return data || [];
}

export async function searchUsers(query) {
  if (!query.trim()) return [];

  const { data } = await api.get("/users", {
    params: { search: query.trim() },
  });

  return data || [];
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/messages/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function updateUserProfile(uid, profile) {
  const { data } = await api.patch(`/users/${uid}`, profile);
  return data;
}
