import "./aboutUs.scss";

export default function AboutUs({ firstPicture, secondPicture }) {
  return (
    <div id="about" className="aboutUsContainer">
      <div className="aboutUsLeftSide">
        <div className="aboutUsTitle">Despre Simonia Luxury</div>
        <div className="aboutUsSubtitle">
          Mobilă la comandă de lux pentru eleganța și confortul casei tale
        </div>
        <div className="aboutUsText">
          Simonia Luxury creează mobilă moale de lux realizată exclusiv la
          comandă, pentru a se potrivi perfect stilului și nevoilor tale.
          <br />
          Echipa noastră produce canapele, colțare și paturi personalizate,
          folosind materiale de cea mai înaltă calitate. Fiecare piesă de
          mobilier este proiectată special pentru tine, astfel încât să
          transforme orice locuință într-un spațiu rafinat, confortabil și
          elegant.
          <br />
          Oferim servicii complete: consultanță personalizată, design unic,
          producție atentă și montaj profesional direct la domiciliu.
          <br />
          Alegând Simonia Luxury, beneficiezi de mobilă la comandă, de calitate
          superioară, care adaugă stil, confort și rafinament fiecărei camere
          din casa ta.
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
