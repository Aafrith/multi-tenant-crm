import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

export const AuthContext = createContext();

/**
 * Decode a JWT and return null if invalid/expired.
 */
function safeDecode(token) {
  try {
    const decoded = jwtDecode(token);
    // Reject already-expired tokens so PrivateRoute doesn't flash protected content
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // JWT payload (role, org_id, etc.)
  const [profile, setProfile] = useState(null); // Full user profile from /me/
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/me/");
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = safeDecode(token);
      if (decoded) {
        setUser(decoded);
        fetchProfile();
      } else {
        // Token expired — clear stale data
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }
    setLoading(false);
  }, [fetchProfile]);

  const login = async (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    const decoded = safeDecode(accessToken);
    setUser(decoded);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setProfile(null);
  };

  // Derive role: prefer profile (server-authoritative), fall back to JWT claim
  const role = profile?.role ?? user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}
