import "./headerIcons.scss";
import cartIcon from "../../assets/header/cart.png";

export default function HeaderIcons({ cartCount = 0, additionClass }) {
  return (
    <div className={`header-icons ${additionClass}`}>
      <div className="icon-group cart">
        <img className="icon" src={cartIcon} alt="" />
        <div className="cart-badge">{cartCount}</div>
      </div>
    </div>
  );
}
