import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe on the rendered page against WCAG 2.2 A and AA, and fails with every
 * violation found. Colour contrast is left to the browser checks: jsdom does not
 * compute styles.
 */
export async function expectAccessible(context: Element = document.body): Promise<void> {
  const { violations } = await axe.run(context, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}
