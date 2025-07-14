export default function Section(title, desctiption, children, ...props) {
  return (
    <div {...props}>
      <div>{title}</div>
      <div>{desctiption}</div>
    </div>
  );
}
