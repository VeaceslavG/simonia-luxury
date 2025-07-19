import headerSofa from "./assets/header/headerSofa.png";
import wishProductIcon from "./assets/products/wishIcon.png";
import coltarEx from "./assets/aboutUs/coltarEx.jpg";
import patEx from "./assets/aboutUs/patEx.jpg";

import Nav from "./components/Nav/Nav";
import IntroBlock from "./components/IntroBlock/IntroBlock";
import Benefits from "./components/Benefits/Benefits";
import Products from "./components/Products/Products";
import AboutUs from "./components/AboutUs/AboutUs";
import Contacts from "./components/Contacts/Contacts";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <>
      <main>
        <Nav />
        <IntroBlock
          introTitle="Mobilă moale la comandă"
          introText="Mobila dorințelor tale"
          introImage={headerSofa}
        />
        <Benefits />
        <Products wishIcon={wishProductIcon} />
        <AboutUs firstPicture={patEx} secondPicture={coltarEx} />
        <Contacts />
        <Footer />
      </main>
    </>
  );
}

export default App;
