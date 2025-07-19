import React, { useState, useEffect } from "react";
import { slide as Menu } from "react-burger-menu";
import "./burgerMenu.scss";

import MenuLinks from "../MenuLinks";

export default function BurgerMenu() {
  const [activeSection, setActiveSection] = useState("catalog");
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = {
    catalog: [
      { text: "Canapele", href: "/canapele" },
      { text: "Colțare", href: "/coltare" },
      { text: "Fotolii", href: "/fotolii" },
      { text: "Paturi", href: "/paturi" },
    ],
    menu: [
      { text: "Acasă", href: "/" },
      { text: "Beneficii", href: "/" },
      { text: "Produse", href: "/" },
      { text: "Despre Noi", href: "/" },
      { text: "Contacte", href: "/" },
    ],
  };

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      const menuWrap = document.querySelector(".bm-menu-wrap");
      if (menuWrap && !menuWrap.contains(e.target) && isOpen) {
        closeMenu();
      }
    };

    const handleEsc = (e) => e.key === "Escape" && closeMenu();

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  return (
    <Menu
      right
      isOpen={isOpen}
      onStateChange={(state) => setIsOpen(state.isOpen)}
      aria-label="Main menu"
    >
      <nav aria-label="Menu sections">
        <div className="burger-switcher" role="tablist">
          <div className="switcher-left">
            <button
              className={activeSection === "catalog" ? "active" : ""}
              onClick={() => setActiveSection("catalog")}
              aria-selected={activeSection === "catalog"}
              role="tab"
              aria-controls="catalog-panel"
              id="catalog-tab"
            >
              Catalog
            </button>
          </div>
          <div className="switcher-right">
            <button
              className={activeSection === "menu" ? "active" : ""}
              onClick={() => setActiveSection("menu")}
              aria-selected={activeSection === "menu"}
              role="tab"
              aria-controls="menu-panel"
              id="menu-tab"
            >
              Meniu
            </button>
          </div>
        </div>

        {activeSection === "catalog" && (
          <div
            id="catalog-panel"
            role="tabpanel"
            aria-labelledby="catalog-tab"
            tabIndex="0"
          >
            <MenuLinks onClick={closeMenu} items={menuItems.catalog} />
          </div>
        )}

        {activeSection === "menu" && (
          <div
            id="menu-panel"
            role="tabpanel"
            aria-labelledby="menu-tab"
            tabIndex="0"
          >
            <MenuLinks onClick={closeMenu} items={menuItems.menu} />
          </div>
        )}
      </nav>
    </Menu>
  );
}
