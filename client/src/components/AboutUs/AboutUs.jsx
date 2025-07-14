import "./aboutUs.scss";

export default function AboutUs({ firstPicture, secondPicture }) {
  return (
    <div className="aboutUsContainer">
      <div className="aboutUsLeftSide">
        <div className="aboutUsTitle">Despre noi</div>
        <div className="aboutUsText">
          Compania Simonia Luxury este alcătuită dintr-o echipă care are ca scop
          crearea mobilei moi, menită să lase impresii de neuitat clienților
          noștri. Ne dorim să oferim soluții care îmbină confortul, luxul și
          utilitatea. Odată ce apelați la noi, vă vom fi alături începând cu o
          consultație și terminând cu amenajarea mobilei în locuințele
          dumneavoastră. Vă asigurăm că farmecul și liniștea celor care ne aleg
          vor depinde de canapelele, colțarele, fotoliile și paturile pe care le
          realizăm.
        </div>
      </div>
      <div className="aboutUsRightSide">
        <img className="mainImg" src={firstPicture} alt="" />
        <img className="smallImg" src={secondPicture} alt="" />
      </div>
    </div>
  );
}
