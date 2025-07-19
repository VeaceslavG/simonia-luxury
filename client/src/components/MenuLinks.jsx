export default function MenuLinks({ items, ...props }) {
  return (
    <div className="burger-section">
      {items.map((item) => (
        <a key={item.href} className="menu-item" href={item.href} {...props}>
          {item.text}
        </a>
      ))}
    </div>
  );
}
