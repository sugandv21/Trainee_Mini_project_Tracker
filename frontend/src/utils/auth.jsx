// src/utils/auth.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // <-- new

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    // Validate token by fetching /me/
    api
      .get("/me/")
      .then((resp) => setUser(resp.data))
      .catch(() => {
        // invalid/expired token: clear stored tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const login = async (username, password) => {
    const resp = await api.post("/token/", { username, password });
    localStorage.setItem("access_token", resp.data.access);
    localStorage.setItem("refresh_token", resp.data.refresh);
    // fetch fresh user info
    const me = await api.get("/me/");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
