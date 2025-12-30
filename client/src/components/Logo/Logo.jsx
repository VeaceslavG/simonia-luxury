import { useNavigate } from "react-router-dom";

import logo from "../../assets/header/logo2.0.png";
import "./logo.scss";

export default function Logo({ ...props }) {
  const navigate = useNavigate();

  function handleLogoClick(sectionId) {
    const section = document.getElementById(sectionId);
    if (location.pathname === "/") {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${sectionId}`);
    }
  }

  return (
    <div className="logoContainer" {...props}>
      <img
        src={logo}
        onClick={() => handleLogoClick("home")}
        alt="Logo"
        className="logoImage"
      />
    </div>
  );
}
