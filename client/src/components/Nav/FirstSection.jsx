import { useState } from "react";
import "./nav.scss";
import CatalogBtn from "../CatalogBtn/CatalogBtn";
import MenuItem from "../MenuItem";
import AccountIcon from "../AccountIcon/AccountIcon";

import accountIcon from "../../assets/header/accountIcon.png";
import catalogArrowIcon from "../../assets/header/catalogArrowIcon.png";

export default function FirstSection() {
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

  return (
    <div className="navFirstSectionBG">
      <div className="navFirstSection">
        <span className="phoneNumber" onClick={handleCopy}>
          <span className="numberCopied">
            {copied ? "Copied!" : phoneNumber}
          </span>
        </span>
        <div className="menuItems">
          <CatalogBtn title="Catalog de produse" arrowIcon={catalogArrowIcon} />
          <MenuItem>Acasă</MenuItem>
          <MenuItem>Beneficii</MenuItem>
          <MenuItem>Produse</MenuItem>
          <MenuItem>Despre noi</MenuItem>
          <MenuItem>Contacte</MenuItem>
        </div>
        <AccountIcon accIcon={accountIcon} />
      </div>
    </div>
  );
}
