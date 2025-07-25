// import "./menuItem.scss";

export default function MenuItem({ children, ...props }) {
  return (
    <div className="menu-item">
      <span className="menuTitle" {...props}>
        {children}
      </span>
    </div>
  );
}
