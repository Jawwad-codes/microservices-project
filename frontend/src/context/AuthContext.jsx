/** @format */

import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("sf_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sf_user"));
    } catch {
      return null;
    }
  });

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("sf_token", newToken);
    localStorage.setItem("sf_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuth: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
