
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { login as apiLogin, refreshAccess, getCurrentUser } from "./axios"; // adjust path if needed

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  // helper to set tokens in localStorage (api.interceptors.request already reads access_token)
  const setTokens = ({ access, refresh }) => {
    if (access) localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      // If 401, tokens may be missing/invalid — try refresh once
      if (err && err.status === 401) {
        try {
          await refreshAccess();
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch (err2) {
          clearTokens();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    // initial load of current user on mount
    loadUser();

    // Response interceptor: if we get a 401, attempt refresh once then retry original request
    const interceptor = api.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const original = error.config;
        // avoid infinite loop: only try once per request
        if (
          error.response &&
          error.response.status === 401 &&
          !original._retry &&
          localStorage.getItem("refresh_token")
        ) {
          original._retry = true;
          try {
            const newAccess = await refreshAccess();
            // set Authorization header for original request and retry
            original.headers["Authorization"] = `Bearer ${newAccess}`;
            return api(original);
          } catch (refreshErr) {
            // refresh failed: log out
            clearTokens();
            setCurrentUser(null);
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [loadUser]);

  // wrapper used by your Login component
  const login = async (usernameOrEmail, password) => {
    // call the API login helper which returns { access, refresh }
    const tokens = await apiLogin(usernameOrEmail, password);
    // tokens may be resp.data; ensure we set them
    setTokens(tokens);
    // fetch the current user after login
    await loadUser();
    return tokens;
  };

  const logout = (opts = {}) => {
    clearTokens();
    setCurrentUser(null);
    if (opts.redirect !== false) {
      navigate("/login");
    }
  };

  const value = {
    currentUser,
    loadingUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    reloadUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
