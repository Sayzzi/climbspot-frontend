import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

/** Says that something the Visitor did worked, appearing as it happens. */
export function Confirmation({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p
      role="status"
      className={cn(
        'flex animate-panel-in items-center gap-2 rounded-md bg-moss/10 px-3 py-2 text-sm font-semibold text-moss',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
        <path
          d="M3 8.5 6.5 12 13 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}
