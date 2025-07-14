// import "./menuItem.scss";

export default function MenuItem({ children }) {
  return (
    <div className="menu-item">
      <span className="menuTitle">{children}</span>
    </div>
  );
}
