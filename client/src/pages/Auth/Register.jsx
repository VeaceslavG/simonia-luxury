import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register({ children }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }

      // data = { user: {id, email, name}, token: "JWT..." }
      await login(data.user, data.token);

      // redirect imediat la profil
      navigate("/account");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <>
      <div className="profileContainer">
        <h2 className="registerTitle">Register</h2>
        <form className="inputForm" onSubmit={handleRegister}>
          <input
            id="name"
            type="text"
            placeholder="Nume"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="submitRegister" type="submit">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {children}
      </div>
    </>
  );
}
