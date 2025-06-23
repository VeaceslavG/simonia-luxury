export default function CatalogBtn({ title, menuIcon, arrowIcon }) {
  return (
    <div className="menu-item">
      <img src={menuIcon} alt="Catalog Icon" className="catalogIcon" />
      <span className="menuTitle">{title}</span>
      <img src={arrowIcon} alt="Arrow Icon" className="arrowIcon" />
    </div>
  );
}
