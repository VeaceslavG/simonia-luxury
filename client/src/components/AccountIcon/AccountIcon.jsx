import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./accountIcon.scss";

export default function LogOrRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="accountManagement" onClick={() => navigate("/account")}>
      {user && <span className="userName ml-2 me-2">{user?.name}</span>}
      <svg
        className="accIcon"
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3" />
        <circle cx="12" cy="10" r="3" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    </div>
  );
}
