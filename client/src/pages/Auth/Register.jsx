import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

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
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Account</h2>
      <form onSubmit={handleRegister} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Full Name"
          className="border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
}
