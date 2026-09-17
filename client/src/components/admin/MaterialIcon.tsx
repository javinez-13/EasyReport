export function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return <span className={`material-icons ${className}`}>{name}</span>;
}
