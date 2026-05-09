import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleButton from "../../components/GoogleButton/GoogleButton";
import { API_URL } from "../../config/api";
import { handleBlur } from "../../components/Utils/formHandlers";
import { toast } from "react-toastify";

export default function Login({ children }) {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

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

      toast.success("Te-ai conectat cu succes!", { position: "top-center", autoClose: 2000 });

      await login(data.user);
      await refreshUser();
      navigate("/account");
    } catch (err) {
      toast.error(err.message, {
        className: "custom-toast",
        bodyClassName: "custom-toast-body",
        progressClassName: "custom-toast-progress",
        position: "top-center",
        autoClose: 2000,
      });
    }

    setLoading(false);
  }

  return (
    <>
      <div className="profileContainer">
        <h2 className="loginTitle">Login</h2>
        <form className="inputForm" onSubmit={handleLogin}>
          <div>
            <input
              id="email"
              type="email"
              placeholder="E-mail"
              className="emailLoginInput input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onBlur={handleBlur}
              />
            <span className="inputFormErrMessage">Introduceți o adresă de e-mail validă (ex: name@example.com)!</span>
          </div>
          <div>
            <input
              id="password"
              type="password"
              placeholder="Parolă"
              className="passwordLoginInput input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți parola (minim 8 caractere)!</span>
          </div>
          <button type="submit" className="submitLogin">
            {loading ? "Logging in..." : "Login"}
          </button>
          <GoogleButton />
        </form>
        {children}
      </div>
    </>
  );
}
