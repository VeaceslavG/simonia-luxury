import { useState } from "react";
import Login from "../Auth/Login";
import Register from "../Auth/Register";
import Profile from "../Auth/Profile";
import { useAuth } from "../../context/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");

  if (user) return <Profile />;

  return (
    <div className="p-4 max-w-md mx-auto">
      {mode === "login" ? (
        <>
          <Login />
          <p className="mt-4 text-center">
            Don't have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setMode("register")}
            >
              Register
            </span>
          </p>
        </>
      ) : (
        <>
          <Register />
          <p className="mt-4 text-center">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setMode("login")}
            >
              Login
            </span>
          </p>
        </>
      )}
    </div>
  );
}
