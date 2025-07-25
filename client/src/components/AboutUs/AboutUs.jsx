import "./aboutUs.scss";

export default function AboutUs({ firstPicture, secondPicture }) {
  return (
    <div id="about" className="aboutUsContainer">
      <div className="aboutUsLeftSide">
        <div className="aboutUsTitle">Despre Simonia Luxury</div>
        <div className="aboutUsSubtitle">
          Mobilă Moale Premium pentru Eleganța și Confortul Casei Tale
        </div>
        <div className="aboutUsText">
          Simonia Luxury este o companie dedicată creării de mobilă moale de
          lux, realizată cu atenție la detalii și materiale de cea mai înaltă
          calitate. <br />
          Echipa noastră de specialiști produce canapele, colțare, fotolii și
          paturi elegante, fiecare piesă fiind concepută pentru a transforma
          orice locuință într-un spațiu rafinat și confortabil. <br />
          Oferim servicii complete: consultație personalizată, design unic,
          producție atentă și montaj profesional direct în casa ta. <br />
          Alegând Simonia Luxury, te bucuri de un ambient plin de stil, liniște
          și farmec, creat special pentru tine și familia ta.
        </div>
      </div>
      <div className="aboutUsRightSide">
        <img
          className="mainImg"
          src={firstPicture}
          alt="Mobilă moale premium Simonia Luxury"
        />
        <img className="smallImg" src={secondPicture} alt="Colțare de lux" />
      </div>
    </div>
  );
}
