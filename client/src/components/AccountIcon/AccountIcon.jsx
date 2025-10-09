import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AccountIcon.scss";

export default function LogOrRegister({ accIcon }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="accountManagement" onClick={() => navigate("/account")}>
      {user && <span className="userName ml-2 me-2">{user?.name}</span>}
      <img className="accIcon" src={accIcon} alt="" />
    </div>
  );
}
