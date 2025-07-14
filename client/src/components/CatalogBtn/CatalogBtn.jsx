import "./catalogBtn.scss";

export default function CatalogBtn({ title, arrowIcon }) {
  const categories = ["Canapele", "Coltare", "Fotolii", "Paturi"];

  return (
    <div className="catalog menu-item dropdown">
      <div className="menuTitleWrapper">
        <span className="menuTitle">{title}</span>
        <img src={arrowIcon} alt="Arrow Icon" className="arrowIcon" />
      </div>

      <div className="dropdown-content">
        <ul>
          {categories.map((category, index) => (
            <li key={index}>
              <a href="#">{category}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
