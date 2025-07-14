import { useState } from "react";

import "./nav.scss";
import CatalogBtn from "../CatalogBtn/CatalogBtn";
import MenuItem from "../MenuItem";
import AccountIcon from "../AccountIcon/AccountIcon";
import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import HeaderIcons from "../HeaderIcons/HeaderIcons";

import logoIcon from "../../assets/header/logo.png";
import catalogArrowIcon from "../../assets/header/catalogArrowIcon.png";
import accountIcon from "../../assets/header/accountIcon.png";

export default function Nav() {
  const [copied, setCopied] = useState(false);

  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  const textToCopy = "+373 602 85 786";

  function handleCopy() {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log("Phone Number Copied Successfully!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  return (
    <div className="navContainer">
      <div className="navFirstSectionBG">
        <div className="navFirstSection">
          <span className="phoneNumber" onClick={handleCopy}>
            <span className="numberCopied">
              {copied ? "Copied!" : textToCopy}
            </span>
          </span>
          <div className="menuItems">
            <CatalogBtn
              title="Catalog de produse"
              arrowIcon={catalogArrowIcon}
            />
            <MenuItem>Principală</MenuItem>
            <MenuItem>Mobilier</MenuItem>
            <MenuItem>Despre noi</MenuItem>
            <MenuItem>Contacte</MenuItem>
          </div>
          <AccountIcon accIcon={accountIcon} />
        </div>
      </div>
      <div className="navSecondSection">
        <Logo logoIcon={logoIcon} />
        <SearchBar onSearch={handleSearch} />
        <HeaderIcons />
      </div>
    </div>
  );
}
