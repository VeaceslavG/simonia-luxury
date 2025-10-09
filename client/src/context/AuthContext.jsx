import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(userData) {
    setUser(userData);
  }

  async function logout() {
    try {
      await fetch("http://localhost:8080/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      document.cookie = "guestCart=; path=/; max-age=0";
      console.log("🚪 Logout - cleared guest cart cookie");
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        console.log("🔄 Loading user from /api/me...");
        const res = await fetch("http://localhost:8080/api/me", {
          credentials: "include",
        });

        console.log("📄 /api/me response status:", res.status);

        if (res.ok) {
          const userData = await res.json();
          console.log("✅ User loaded:", userData);
          setUser(userData);
        } else {
          console.log("❌ /api/me failed with status:", res.status);
          setUser(null);
        }
      } catch (err) {
        console.error("🚨 Error loading user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Loading authentication...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
