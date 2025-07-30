import { useLocation } from "react-router-dom";
// import { useNavigate } from "react-router-dom";

export default function MenuLinks({ items, onClick, ...props }) {
  // const navigate = useNavigate();
  const location = useLocation();

  function handleClick(e, href) {
    e.preventDefault();
    if (onClick) onClick();

    const sectionId = href.replace("/#", "");

    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = href;
    }
  }

  return (
    <div className="burger-section">
      {items.map((item, i) => (
        <span key={i}>
          <a
            href={item.href}
            className="menu-item"
            onClick={(e) => handleClick(e, item.href)}
            {...props}
          >
            {item.text}
          </a>
        </span>
      ))}
    </div>
  );
}
