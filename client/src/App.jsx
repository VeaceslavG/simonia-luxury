import catalogIcon from "./assets/catalogIcon.png";
import catalogArrowIcon from "./assets/catalogArrowIcon.png";
import accountIcon from "./assets/accountIcon.png";
import headerSofa from "./assets/headerSofa.png";

import IntroBlock from "./components/IntroBlock/IntroBlock";
import MenuItem from "./components/MenuItem";
import CatalogBtn from "./components/CatalogBtn";
import LogOrRegister from "./components/LogOrRegister/LogOrRegister";

function App() {
  return (
    <div>
      <div className="navContainer">
        <nav aria-label="Main navigation">
          <span className="phoneNumber">+373 602 85 786</span>
          <div className="menuItems">
            <CatalogBtn
              title="Catalog de produse"
              menuIcon={catalogIcon}
              arrowIcon={catalogArrowIcon}
            />
            <MenuItem title="Principală" />
            <MenuItem title="Mobilier" />
            <MenuItem title="Despre noi" />
            <MenuItem title="Contacte" />
          </div>
          <LogOrRegister accIcon={accountIcon} action="Log In / Register" />
        </nav>
      </div>
      <IntroBlock
        introTitle="Mobilă moale la comandă"
        introText="Mobila dorințelor tale"
        introImage={headerSofa}
      />
    </div>
  );
}

export default App;
