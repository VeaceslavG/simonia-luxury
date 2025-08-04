import { useNavigate, useLocation } from "react-router-dom";
import "./catalogBtn.scss";

export default function CatalogBtn({ title, arrowIcon, onCategorySelect }) {
  const categories = ["Canapele", "Coltare", "Fotolii", "Paturi"];
  const navigate = useNavigate();
  const location = useLocation();

  function handleCatalogItemClick(category) {
    const lowerCaseCategory = category.toLowerCase();

    if (location.pathname !== "/") {
      navigate("/", {
        state: { selectedCategory: lowerCaseCategory },
      });
    } else {
      if (onCategorySelect) {
        onCategorySelect(lowerCaseCategory);
      }
    }
  }

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
              <a
                href="/#products"
                onClick={(e) => {
                  e.preventDefault();
                  handleCatalogItemClick(category);
                }}
              >
                {category}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
