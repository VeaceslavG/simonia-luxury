import "./nav.scss";
import CartIcon from "../HeaderIcons/CartIcon";
import BurgerMenu from "../BurgerMenu/BurgerMenu";
import Logo from "../Logo/Logo";

export default function SecondSection({ onCategorySelect }) {
  return (
    <div className="navSecondSection">
      <div className="mobileCartIcon">
        <CartIcon />
        <Logo />
      </div>

      <div className="mobile-burger-menu">
        <BurgerMenu onCategorySelect={onCategorySelect} />
      </div>
    </div>
  );
}
