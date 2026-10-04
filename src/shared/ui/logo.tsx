import { cn } from '@/shared/lib/cn';

/**
 * ClimbSpot's mark: a red-and-white trail waymark set on a contour line. Decorative:
 * the name beside it says what it is.
 */
export function LogoMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('size-9', className)}>
      <path
        d="M3 33 C10 33 12 24 20 24 S30 31 37 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M3 38 C12 38 15 31 21 31 S31 36 37 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <rect x="13" y="5" width="14" height="13" rx="2" fill="currentColor" />
      <rect x="15" y="7" width="10" height="4" fill="#ffffff" />
      <rect x="15" y="11.5" width="10" height="4" fill="var(--color-blaze)" />
      <path d="M20 18 V24" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
