import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleButton from "../../components/GoogleButton/GoogleButton";
import { API_URL } from "../../config/api";
import { handleBlur } from "../../components/Utils/formHandlers";
import { toast } from "react-toastify";

export default function Register({ children }) {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

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

      toast.success("Te-ai conectat cu succes!", { position: "top-center", autoClose: 2000 });

      // Dacă serverul trimite mesaj că user-ul nu e verificat
      if (data.message && data.message.includes("Verifică email")) {
        toast.success(data.message, { position: "top-center", autoClose: 4000 });
      } else if (data.user) {
        // fallback: logare automată dacă server-ul nu returnează double opt-in
        toast.success("Cont creat cu succes!", { position: "top-center", autoClose: 2000 });
        await login(data.user);
        await refreshUser();
        navigate("/account");
      }

      // Reset form
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
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
        <h2 className="registerTitle">Register</h2>
        <form className="inputForm" onSubmit={handleRegister}>
          <div>
            <input
              id="name"
              type="text"
              placeholder="Nume"
              className="input"
              value={name}
              pattern="[A-Za-z ]{3,16}$"
              onChange={(e) => setName(e.target.value)}
              required
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Numele trebuie să aibă 3-16 caractere și să nu includă niciun caracter special!</span>
          </div>
          <div>
            <input
              id="email"
              type="email"
              placeholder="E-mail"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți o adresă de e-mail validă (ex: name@example.com)!</span>
          </div>
          <div>
            <input
              type="tel"
              placeholder="Telefon"
              className="input"
              value={phone}
              pattern="^\+?[0-9]{8,15}$"
              onChange={(e) => setPhone(e.target.value)}
              required
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți un număr de telefon valid (8-15 cifre, opțional + la început)!</span>
          </div>
          <div>
            <input
              id="password"
              type="password"
              placeholder="Parolă"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți parola (minim 8 caractere)!</span>
          </div>
          <button className="submitRegister" type="submit">
            {loading ? "Registering..." : "Register"}
          </button>
          <GoogleButton />
        </form>
        {children}
      </div>
    </>
  );
}
