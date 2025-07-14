import "./headerIcons.scss";
import wishIcon from "../../assets/header/wishIcon.png";
import cartIcon from "../../assets/header/cart.png";

export default function HeaderIcons({ wishlistCount = 0, cartCount = 0 }) {
  return (
    <div className="header-icons">
      <div className="icon-group">
        <img className="icon" src={wishIcon} alt="" />
        <span className="count">{wishlistCount}</span>
      </div>

      <div className="divider" />

      <div className="icon-group cart">
        <img className="icon" src={cartIcon} alt="" />
        <div className="cart-badge">{cartCount}</div>
      </div>
    </div>
  );
}
