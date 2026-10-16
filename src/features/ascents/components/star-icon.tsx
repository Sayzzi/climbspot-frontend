/** The star of Favourite Ascents; its colours come from the classes given. */
export function StarIcon({
  className,
  pathClassName,
}: {
  readonly className?: string;
  readonly pathClassName?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className={pathClassName}
      />
    </svg>
  );
}
