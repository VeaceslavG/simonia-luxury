import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "./footer.scss";
import logo from "../../assets/footer/logo.png";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);

  const phoneNumber = "+373 602 85 786";

  function handleCopy() {
    navigator.clipboard
      .writeText(phoneNumber)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  function handleMenuClick(sectionId) {
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  }

  const facebookAcc = "https://www.facebook.com/simonia.luxury";
  const instagramAcc = "https://www.instagram.com/simonia_luxury/";
  const tiktokAcc =
    "https://www.tiktok.com/@simonialuxury?is_from_webapp=1&sender_device=pc";
  const googleMapsLocation = "https://maps.app.goo.gl/7rYtqFcwhD9t1dTK9";

  return (
    <div className="footerBg">
      <footer className="footerContainer">
        <div className="footerTop">
          <div className="footerLogo">
            <img src={logo} alt="Simonia Luxury Logo" />
          </div>

          <div className="footerMenu">
            <a
              href="/#home"
              onClick={() => {
                handleMenuClick("home");
              }}
            >
              Acasă
            </a>
            <a
              href="/#benefits"
              onClick={() => {
                handleMenuClick("benefits");
              }}
            >
              Beneficii
            </a>
            <a
              href="/#products"
              onClick={() => {
                handleMenuClick("products");
              }}
            >
              Produse
            </a>
            <a
              href="/#about"
              onClick={() => {
                handleMenuClick("about");
              }}
            >
              Despre noi
            </a>
            <a
              href="/#contacts"
              onClick={() => {
                handleMenuClick("contacts");
              }}
            >
              Contacte
            </a>
          </div>

          <div className="footerSocial">
            <a href={instagramAcc} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={facebookAcc} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href={tiktokAcc} target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
          </div>

          <div className="footerContact">
            <span className="contactItem" onClick={handleCopy}>
              <span className="numberCopied">
                {copied ? "Copied!" : phoneNumber}
              </span>
            </span>
            <a
              target="_blanc"
              href={googleMapsLocation}
              className="contactItem"
            >
              Calea Moșilor 4
            </a>
            <span className="text contactItem">
              Marți - Duminică: 09:00 - 16:00
              <br />
              Disponibili online până la ora 21:00
            </span>
          </div>
        </div>

        <div className="footerBottom">
          <div className="footerDeveloper">
            <a
              href="https://github.com/VeaceslavG"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#DCD7C9"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.6.3-1.1.6-1.4-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.1-3.2-.1-.3-.5-1.5.1-3.1 0 0 .9-.3 3.2 1.1.9-.2 1.8-.3 2.7-.3.9 0 1.8.1 2.7.3 2.3-1.4 3.2-1.1 3.2-1.1.6 1.6.2 2.8.1 3.1.7.9 1.1 1.9 1.1 3.2 0 4.5-2.7 5.5-5.3 5.8.3.3.6.8.6 1.6v2.4c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
              </svg>
              <span>Realizat de Veaceslav Gorbuleac</span>
            </a>
          </div>

          <p className="footerCopy">
            &copy; {new Date().getFullYear()} Simonia Luxury. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
