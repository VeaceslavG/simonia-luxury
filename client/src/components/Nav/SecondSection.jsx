import "./nav.scss";
import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import HeaderIcons from "../HeaderIcons/HeaderIcons";
import BurgerMenu from "../BurgerMenu/BurgerMenu";

import logo from "../../assets/header/logo.png";

export default function SecondSection({ onSearch }) {
  return (
    <div className="navSecondSection">
      <div className="mobileCartIcon">
        <HeaderIcons />
      </div>

      <Logo logoIcon={logo} />

      <SearchBar onSearch={onSearch} />

      <HeaderIcons additionClass="desktopCartIcon" />

      <div className="mobile-burger-menu">
        <BurgerMenu />
      </div>
    </div>
  );
}
