import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import headerSofa from "../../assets/header/sofaBlue.png";
import coltarEx from "../../assets/aboutUs/coltarEx.jpg";
import patEx from "../../assets/aboutUs/patEx.jpg";

import Nav from "../../components/Nav/Nav";
import IntroBlock from "../../components/IntroBlock/IntroBlock";
import Benefits from "../../components/Benefits/Benefits";
import Products from "../../components/Products/Products";
import AboutUs from "../../components/AboutUs/AboutUs";
import Contacts from "../../components/Contacts/Contacts";
import Footer from "../../components/Footer/Footer";

export default function HomePage() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(
    location.state?.selectedCategory || "canapele"
  );

  const navigate = useNavigate();

  const hasHandledState = useRef(false);

  useEffect(() => {
    if (!hasHandledState.current) {
      if (location.state?.selectedCategory) {
        setSelectedCategory(location.state.selectedCategory);

        setTimeout(() => {
          const section = document.getElementById("products");
          if (section) {
            section.scrollIntoView({ behavior: "smooth" });
          }
        }, 0);
      } else {
        setSelectedCategory("canapele");
      }

      hasHandledState.current = true;

      // Curățăm state-ul în URL (navigare "internă")
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  function handleCategorySelect(category) {
    const lowerCaseCategory = category.toLowerCase();
    setSelectedCategory(lowerCaseCategory);

    if (location.pathname === "/") {
      const section = document.getElementById("products");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/", {
        state: { selectedCategory: lowerCaseCategory },
      });
    }
  }

  return (
    <>
      <Nav onCategorySelect={handleCategorySelect} />
      <IntroBlock
        introTitle="Mobilă moale la comandă"
        introText="Mobilă de lux pentru casa ta"
        introImage={headerSofa}
      />
      <Benefits />
      <Products selectedCategory={selectedCategory} />
      <AboutUs firstPicture={patEx} secondPicture={coltarEx} />
      <Contacts />
      <Footer />
    </>
  );
}
