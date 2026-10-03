import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface Fact {
  readonly term: string;
  readonly value: ReactNode;
  /** Lets a long value span several columns. */
  readonly className?: string;
}

/** Measurements and other facts as a definition list. */
export function FactList({
  facts,
  className,
}: {
  readonly facts: readonly Fact[];
  readonly className?: string;
}) {
  return (
    <dl className={cn('grid gap-x-4 gap-y-1 text-sm', className)}>
      {facts.map(({ term, value, className: factClassName }) => (
        <div key={term} className={factClassName}>
          <dt className="text-ink-muted">{term}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
