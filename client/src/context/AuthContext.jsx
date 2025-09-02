import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchMe(token) {
  const res = await fetch("http://localhost:8080/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not fetch user");
  return await res.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);

  async function login(userData, jwtToken) {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("authToken", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  useEffect(() => {
    // dacă nu avem token, nu încercăm să încărcăm user
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        const userData = await fetchMe(token);
        if (!cancelled) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (err) {
        if (!cancelled) logout();
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]); // ← rulează la schimbarea token-ului

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
