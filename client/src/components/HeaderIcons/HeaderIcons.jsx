import "./headerIcons.scss";
import cartIcon from "../../assets/header/cart.png";
import { useCart } from "../../context/CartContext";

export default function HeaderIcons({ additionClass }) {
  const { cartItems, openCart } = useCart();

  return (
    <div className={`header-icons ${additionClass}`}>
      <div className="icon-group cart">
        <img onClick={openCart} className="icon" src={cartIcon} alt="" />
        <div className="cart-badge">
          <div className="cart-badge">{cartItems.length}</div>
        </div>
      </div>
    </div>
  );
}
