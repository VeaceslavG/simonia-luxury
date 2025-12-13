import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleButton from "../../components/GoogleButton/GoogleButton";
import { API_URL } from "../../config/api";

export default function Login({ children }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      await login(data.user);

      // redirect la pagina de profil
      navigate("/account");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <>
      <div className="profileContainer">
        <h2 className="loginTitle">Login</h2>
        <form className="inputForm" onSubmit={handleLogin}>
          <input
            id="email"
            type="email"
            placeholder="E-mail"
            className="emailLoginInput input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="passwordLoginInput input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submitLogin">
            {loading ? "Logging in..." : "Login"}
          </button>
          <GoogleButton />
        </form>
        {error && <p className="error-message">{error}</p>}
        {children}
      </div>
    </>
  );
}
