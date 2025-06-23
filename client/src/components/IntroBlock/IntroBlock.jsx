import "./introBlock.scss";
import logoIcon from "../../assets/logo.png";
import Button from "../Button";
import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import HeaderIcons from "../HeaderIcons/HeaderIcons";

export default function IntroBlock({ introTitle, introText, introImage }) {
  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  return (
    <div className="introBlockContainer">
      <div className="introUpSection">
        <Logo logoIcon={logoIcon} />
        <SearchBar onSearch={handleSearch} />
        <HeaderIcons />
      </div>
      <div className="introBlockBG">
        <div className="introBlock">
          <div className="introLeftSection">
            <span className="introTitle">{introTitle}</span>
            <span className="introText">{introText}</span>
            <div className="introBlockBtns">
              <Button className="orderBtn" title="Comandă" />
              <Button className="exploreBtn" title="Explorează" />
            </div>
          </div>
          <div className="introImageContainer">
            <img className="introImage" src={introImage} alt="Furniture" />
          </div>
        </div>
      </div>
    </div>
  );
}
