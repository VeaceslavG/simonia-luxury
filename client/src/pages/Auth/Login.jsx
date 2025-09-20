import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login({ children }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Invalid credentials");

      // data = { user: {id, email, name}, token: "JWT..." }
      await login(data.user, data.token);

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
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="passwordLoginInput input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="submitLogin">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {children}
      </div>
    </>
  );
}
