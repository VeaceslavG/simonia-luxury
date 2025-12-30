import { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config/api";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(userData) {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      document.cookie = "guestCart=; path=/; max-age=0";
    }
  }

  useEffect(() => {
    let cancelled = false;

    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("unauthorized");

        const data = await res.json();

        if (!cancelled) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUser();
    return () => (cancelled = true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
