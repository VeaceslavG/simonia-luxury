import "./cartIcon.scss";
import { useCart } from "../../context/CartContext";

export default function HeaderIcons({ additionClass }) {
  const { cartItems, openCart } = useCart();

  return (
    <div className={`header-icons ${additionClass}`}>
      <div className="cart">
        <svg
          onClick={openCart}
          className="cartIcon"
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="20.5" r="1" />
          <circle cx="18" cy="20.5" r="1" />
          <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1" />
        </svg>
        <div className="cart-badge">
          <div className="cart-badge">{cartItems.length}</div>
        </div>
      </div>
    </div>
  );
}
