import "./introBlock.scss";
import Button from "../Button";

export default function IntroBlock({ introTitle, introText, introImage }) {
  return (
    <div className="introBlockContainer">
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
