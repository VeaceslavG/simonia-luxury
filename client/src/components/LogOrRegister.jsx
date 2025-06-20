export default function LogOrRegister({ accIcon, action }) {
  return (
    <div className="accountManagement">
      <img className="accIcon" src={accIcon} alt="" />
      <span className="accountAction">{action}</span>
    </div>
  );
}
