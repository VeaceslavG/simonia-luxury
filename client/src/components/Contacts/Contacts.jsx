import "./contacts.scss";
import instagramIcon from "../../assets/contacts/instagram.png";
import facebookIcon from "../../assets/contacts/facebook.png";
import tiktokIcon from "../../assets/contacts/tik-tok.png";

import Map from "../Map";

export default function Contacts() {
  const facebookAcc = "https://www.facebook.com/simonia.luxury";
  const instagramAcc = "https://www.instagram.com/simonia_luxury/";
  const tiktokAcc =
    "https://www.tiktok.com/@simonialuxury?is_from_webapp=1&sender_device=pc";

  return (
    <div id="contacts" className="contactsBG">
      <div className="contactsContainer">
        <div className="contactsLeftSide">
          <div className="contactsTitle">Contacte</div>
          <span className="phoneNumber">+373 602 85 786</span>
          <span className="address">Calea Moșilor 4</span>
          <div className="scheduleSection">
            <span className="scheduleTitle">Orar</span>
            <span className="schedule">
              <span>Marți - Duminică: 09:00 - 16:00</span>
              <span>Disponibili on-line în fiecare zi până la ora 21:00</span>
            </span>
          </div>
          <div className="socialMedia">
            <a href={facebookAcc} target="_blank" rel="noopener noreferrer">
              <img src={facebookIcon} alt="" className="facebook" />
            </a>
            <a href={instagramAcc} target="_blank" rel="noopener noreferrer">
              <img src={instagramIcon} alt="" className="instagram" />
            </a>
            <a href={tiktokAcc} target="_blank" rel="noopener noreferrer">
              <img src={tiktokIcon} alt="" className="instagram" />
            </a>
          </div>
        </div>
        <div className="contactsRightSide">
          <Map />
        </div>
      </div>
    </div>
  );
}
