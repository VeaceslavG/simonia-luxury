import catalogIcon from "./assets/catalogIcon.png";
import catalogArrowIcon from "./assets/catalogArrowIcon.png";
import accountIcon from "./assets/accountIcon.png";
import MenuItem from "./components/MenuItem";
import CatalogItem from "./components/CatalogItem";
import LogOrRegister from "./components/LogOrRegister";

function App() {
  return (
    <div className="headerContainer">
      <nav aria-label="Main navigation">
        <span className="phoneNumber">+373 602 85 786</span>
        <div className="menuItems">
          <CatalogItem
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
  );
}

export default App;
