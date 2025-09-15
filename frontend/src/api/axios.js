import axios from "axios";

const BACKEND = "https://trainee-mini-project-tracker-8btp.onrender.com".replace(/\/+$/, "");

export async function login(emailOrUsername, password) {
  try {
    const resp = await axios.post(
      `${BACKEND}/api/token/`,
      { username: emailOrUsername, password },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    // store tokens
    localStorage.setItem("access_token", resp.data.access);
    localStorage.setItem("refresh_token", resp.data.refresh);
    return resp.data;
  } catch (err) {
    // surface error nicely
    if (err.response) {
      // server returned response
      throw { status: err.response.status, data: err.response.data };
    }
    throw { message: err.message || "Network error" };
  }
}

// test refresh explicitly
export async function refreshAccess() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("no refresh token saved");
  const resp = await axios.post(`${BACKEND}/api/token/refresh/`, { refresh: refreshToken }, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });
  localStorage.setItem("access_token", resp.data.access);
  return resp.data.access;
}
