import { useState } from "react";
import "./introBlock.scss";
import Button from "../Button";
import OrderModal from "../OrderModal/OrderModal";

export default function IntroBlock({ introTitle, introText, introImage }) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleExploreBtnClick(sectionId) {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="introBlockContainer">
      <div className="introBlockBG">
        <div className="introBlock">
          <div className="introLeftSection">
            <span className="introTitle">{introTitle}</span>
            <span className="introText">{introText}</span>
            <div className="introBlockBtns">
              <Button
                className="orderBtn"
                title="Comandă"
                onClick={() => setModalOpen(true)}
              />
              <OrderModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
              />
              <Button
                className="exploreBtn"
                title="Explorează"
                onClick={() => handleExploreBtnClick("products")}
              />
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
