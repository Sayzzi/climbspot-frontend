import type { Fact } from './fact-list';

/**
 * The few figures that tell things apart (length, elevation gain, gradient), large,
 * like the figures on a trail sign; the rest goes in a plain fact list below.
 */
export function SignFigures({ facts }: { readonly facts: readonly Fact[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {facts.map(({ term, value }) => (
        <div key={term} className="flex flex-col-reverse">
          <dt className="text-xs text-ink-muted">{term}</dt>
          <dd className="font-display text-2xl leading-tight font-bold text-pine">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
