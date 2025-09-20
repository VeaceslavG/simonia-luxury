import { useState } from "react";
import Nav from "../../components/Nav/Nav";
import Login from "../Auth/Login";
import Register from "../Auth/Register";
import Profile from "../Auth/Profile";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import "./accountPage.scss";

export default function AccountPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");

  if (user) {
    return (
      <>
        <Nav />
        <Profile />
        <Footer />
      </>
    );
  }

  return (
    <div>
      {mode === "login" ? (
        <>
          <Nav />
          <Login>
            <p>
              Don't have an account?{" "}
              <button
                className="registerLink"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </p>
          </Login>
          <Footer />
        </>
      ) : (
        <>
          <Nav />
          <Register>
            <p>
              Already have an account?{" "}
              <button className="loginLink" onClick={() => setMode("login")}>
                Login
              </button>
            </p>
          </Register>
          <Footer />
        </>
      )}
    </div>
  );
}
