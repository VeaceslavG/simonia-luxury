import { useState, useEffect } from "react";
import "./nav.scss";
import FirstSection from "./FirstSection";
import SecondSection from "./SecondSection";

//TODO: Cand sunt pe alta pagina si dau click la o categorie din catalogul de produse, se trimite pe pagina principala la produse, dar nu se selecteaza categoria

export default function Nav({ onCategorySelect }) {
  const [isScrolled, setIsScrolled] = useState(false);

  function handleScroll() {
    setIsScrolled(window.scrollY > 10);
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  return (
    <div id="home" className="navContainer">
      <FirstSection
        isScrolled={isScrolled}
        onCategorySelect={onCategorySelect}
      />
      <SecondSection
        onSearch={handleSearch}
        onCategorySelect={onCategorySelect}
      />
    </div>
  );
}
