export default function TabButton({ children, isSelected, ...props }) {
  return (
    <>
      <button className={isSelected ? "active" : undefined} {...props}>
        {children}
      </button>
    </>
  );
}
