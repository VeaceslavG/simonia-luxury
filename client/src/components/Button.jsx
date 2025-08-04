export default function Button({ title, className, ...props }) {
  return (
    <button className={className} {...props}>
      {title}
    </button>
  );
}
