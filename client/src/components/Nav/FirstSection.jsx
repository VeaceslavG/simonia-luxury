import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./nav.scss";
import CatalogBtn from "../CatalogBtn/CatalogBtn";
import MenuItem from "../MenuItem";
import AccountIcon from "../AccountIcon/AccountIcon";

import accountIcon from "../../assets/header/accountIcon.png";
import catalogArrowIcon from "../../assets/header/catalogArrowIcon.png";

export default function FirstSection({ isScrolled }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);

  const phoneNumber = "+373 602 85 786";

  function handleCopy() {
    navigator.clipboard
      .writeText(phoneNumber)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

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
        <span className="phoneNumber" onClick={handleCopy}>
          <span className="numberCopied">
            {copied ? "Copied!" : phoneNumber}
          </span>
        </span>
        <div className="menuItems">
          <CatalogBtn title="Catalog de produse" arrowIcon={catalogArrowIcon} />
          <MenuItem onClick={() => handleMenuClick("home")}>Acasă</MenuItem>
          <MenuItem onClick={() => handleMenuClick("benefits")}>
            Beneficii
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("products")}>
            Produse
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("about")}>
            Despre noi
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("contacts")}>
            Contacte
          </MenuItem>
        </div>
        <AccountIcon accIcon={accountIcon} />
      </div>
    </div>
  );
}
