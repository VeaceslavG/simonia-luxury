import Logo from "../Logo/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import "./nav.scss";
import CatalogBtn from "../CatalogBtn/CatalogBtn";
import MenuItem from "../MenuItem";
import SearchBar from "../SearchBar/SearchBar";
import CartIcon from "../HeaderIcons/CartIcon";
import AccountIcon from "../AccountIcon/AccountIcon";

import catalogArrowIcon from "../../assets/header/catalogArrowIcon.png";

export default function FirstSection({ isScrolled, onCategorySelect }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleMenuClick(sectionId) {
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  }

  return (
    <div className={`navFirstSectionBG ${isScrolled ? "scrolled" : ""}`}>
      <div className="navFirstSection">
        <Logo />

        <div className="menuItems">
          <CatalogBtn
            title="Catalog de produse"
            arrowIcon={catalogArrowIcon}
            onCategorySelect={onCategorySelect}
          />
          <MenuItem onClick={() => handleMenuClick("home")}>Acasă</MenuItem>
          <MenuItem onClick={() => handleMenuClick("benefits")}>
            Beneficii
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("about")}>
            Despre noi
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("contacts")}>
            Contacte
          </MenuItem>
        </div>
        <SearchBar />
        <CartIcon additionClass="desktopCartIcon" />
        <AccountIcon />
      </div>
    </div>
  );
}
