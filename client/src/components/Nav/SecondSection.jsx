import { useNavigate } from "react-router-dom";

import "./nav.scss";
import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import HeaderIcons from "../HeaderIcons/HeaderIcons";
import BurgerMenu from "../BurgerMenu/BurgerMenu";

import logo from "../../assets/header/logo.png";

export default function SecondSection({ onSearch, onCategorySelect }) {
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
    <div className="navSecondSection">
      <div className="mobileCartIcon">
        <HeaderIcons />
      </div>

      <Logo logoIcon={logo} onClick={() => handleLogoClick("home")} />

      <SearchBar onSearch={onSearch} />

      <HeaderIcons additionClass="desktopCartIcon" />

      <div className="mobile-burger-menu">
        <BurgerMenu onCategorySelect={onCategorySelect} />
      </div>
    </div>
  );
}
