import "./logo.scss";

export default function Logo({ logoIcon, ...props }) {
  return (
    <div className="logoContainer" {...props}>
      <img src={logoIcon} alt="Logo" className="logoImage" />
    </div>
  );
}
