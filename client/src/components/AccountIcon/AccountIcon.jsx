import "./AccountIcon.scss";

export default function LogOrRegister({ accIcon }) {
  return (
    <div className="accountManagement">
      <img className="accIcon" src={accIcon} alt="" />
    </div>
  );
}
