export default function TabButton({ children, isSelected, ...props }) {
  return (
    <>
      <button
        className={`${isSelected ? "active" : undefined} category-btn`}
        {...props}
      >
        {children}
      </button>
    </>
  );
}
