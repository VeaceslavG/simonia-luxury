import React, { useState } from "react";
import "./nav.scss";
import FirstSection from "./FirstSection";
import SecondSection from "./SecondSection";

export default function Nav() {
  //TODO: After scrolling the nav bar should remain on the screen

  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  return (
    <div className="navContainer">
      <FirstSection isScrolled={isScrolled} />
      <SecondSection onSearch={handleSearch} />
    </div>
  );
}
