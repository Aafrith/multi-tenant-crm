import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/me/");
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        setUser(jwtDecode(token));
        fetchProfile();
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, [fetchProfile]);

  const login = async (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    setUser(jwtDecode(accessToken));
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
