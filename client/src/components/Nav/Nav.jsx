import { useState, useEffect } from "react";
import "./nav.scss";
import FirstSection from "./FirstSection";
import SecondSection from "./SecondSection";

export default function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };

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
      <FirstSection isScrolled={isScrolled} />
      <SecondSection onSearch={handleSearch} />
    </div>
  );
}
