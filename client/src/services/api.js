import axios from "axios";

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
});

export default api;
