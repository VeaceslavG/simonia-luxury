import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleButton from "../../components/GoogleButton/GoogleButton";
import { API_URL } from "../../config/api";

export default function Register({ children }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Dacă serverul trimite mesaj că user-ul nu e verificat
      if (data.message && data.message.includes("Verifică email")) {
        setMessage(data.message);
      } else if (data.user) {
        // fallback: logare automată dacă server-ul nu returnează double opt-in
        await login(data.user);
        navigate("/account");
      }

      // Reset form
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
    } catch (err) {
      setMessage(err.message);
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
            required
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <button className="submitRegister" type="submit">
            {loading ? "Registering..." : "Register"}
          </button>
          <GoogleButton />
        </form>

        {message && <p className="registerMessage">{message}</p>}
        {children}
      </div>
    </>
  );
}
