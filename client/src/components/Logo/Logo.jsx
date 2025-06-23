import "./logo.scss";

export default function Logo({ logoIcon }) {
  return (
    <div className="logoContainer">
      <img src={logoIcon} alt="Logo" className="logoImage" />
    </div>
  );
}
