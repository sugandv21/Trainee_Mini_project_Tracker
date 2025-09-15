import axios from "axios";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "https://trainee-mini-project-tracker-8btp.onrender.com")
  .replace(/\/+$/, ""); // no trailing slash

// Axios instance used for most requests (attaches Authorization header)
const api = axios.create({
  baseURL: BACKEND,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access_token");
  if (access) config.headers["Authorization"] = `Bearer ${access}`;
  return config;
});

// raw axios (no baseURL) for token endpoints so they are explicit
const raw = axios;

// === AUTH FUNCTIONS ===
export async function login(emailOrUsername, password) {
  try {
    const resp = await raw.post(
      `${BACKEND}/api/token/`,
      { username: emailOrUsername, password },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    localStorage.setItem("access_token", resp.data.access);
    localStorage.setItem("refresh_token", resp.data.refresh);
    return resp.data;
  } catch (err) {
    if (err.response) return Promise.reject({ status: err.response.status, data: err.response.data });
    return Promise.reject({ message: err.message || "Network error", network: true });
  }
}

export async function refreshAccess() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("no refresh token saved");
  try {
    const resp = await raw.post(
      `${BACKEND}/api/token/refresh/`,
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

// === USER API: debug-friendly getCurrentUser with fallback ===
export async function getCurrentUser() {
  // helper to log with consistent prefix
  const debug = (...args) => {
    if (typeof window !== "undefined" && window.console) {
      console.debug("[API:getCurrentUser]", ...args);
    }
  };

  const tryUrl = async (url) => {
    debug("Requesting", url);
    try {
      const resp = await api.get(url);
      debug("Success", url, resp.status);
      return resp.data;
    } catch (err) {
      debug("Error requesting", url, err && err.response ? err.response.status : err.message);
      throw err;
    }
  };

  // Primary correct path
  try {
    return await tryUrl("/api/me/");
  } catch (err) {
    // If server returned 404 for /api/me/, try legacy /me/ as fallback (temporary)
    if (err && err.response && err.response.status === 404) {
      debug("/api/me/ returned 404 — attempting fallback /me/ (temporary)");
      try {
        return await tryUrl("/me/");
      } catch (err2) {
        // bubble up best error info
        if (err2 && err2.response) {
          return Promise.reject({ status: err2.response.status, data: err2.response.data });
        }
        return Promise.reject({ message: err2.message || "Network error", network: true });
      }
    }

    // other errors: rethrow with structured info
    if (err && err.response) {
      return Promise.reject({ status: err.response.status, data: err.response.data });
    }
    return Promise.reject({ message: err.message || "Network error", network: true });
  }
}

export default api;
