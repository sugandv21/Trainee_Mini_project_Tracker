import axios from "axios";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "https://trainee-mini-project-tracker-8btp.onrender.com")
  .replace(/\/+$/, ""); // remove trailing slash if any

export async function login(emailOrUsername, password) {
  try {
    const resp = await axios.post(
      `${BACKEND}/api/token/`,               // -> https://.../api/token/
      { username: emailOrUsername, password },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    localStorage.setItem("access_token", resp.data.access);
    localStorage.setItem("refresh_token", resp.data.refresh);
    return resp.data;
  } catch (err) {
    if (err.response) {
      return Promise.reject({ status: err.response.status, data: err.response.data });
    }
    return Promise.reject({ message: err.message || "Network error", network: true });
  }
}

export async function refreshAccess() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("no refresh token saved");

  try {
    const resp = await axios.post(
      `${BACKEND}/api/token/refresh/`,       // -> https://.../api/token/refresh/
      { refresh: refreshToken },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    localStorage.setItem("access_token", resp.data.access);
    return resp.data.access;
  } catch (err) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (err.response) return Promise.reject({ status: err.response.status, data: err.response.data });
    return Promise.reject({ message: err.message || "Network error", network: true });
  }
}
