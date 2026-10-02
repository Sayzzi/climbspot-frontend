import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface Tab {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
}

interface TabsProps {
  readonly label: string;
  readonly tabs: readonly Tab[];
  readonly className?: string;
}

/** Tabs following the WAI-ARIA pattern: arrow keys move between tabs. */
export function Tabs({ label, tabs, className }: TabsProps) {
  const [selected, setSelected] = useState(tabs[0]?.id);
  const prefix = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    const tab = tabs[next];
    if (tab) {
      setSelected(tab.id);
      buttons.current[next]?.focus();
    }
  };

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div role="tablist" aria-label={label} className="flex shrink-0 border-b border-pine/10">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${prefix}-${tab.id}-tab`}
            aria-controls={`${prefix}-${tab.id}-panel`}
            aria-selected={tab.id === selected}
            tabIndex={tab.id === selected ? 0 : -1}
            onClick={() => {
              setSelected(tab.id);
            }}
            onKeyDown={(event) => {
              onKeyDown(event, index);
            }}
            className={cn(
              'flex-1 border-b-[3px] px-4 py-3 font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pine',
              tab.id === selected
                ? 'border-blaze text-pine'
                : 'border-transparent text-ink-muted hover:text-pine',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${prefix}-${tab.id}-panel`}
          aria-labelledby={`${prefix}-${tab.id}-tab`}
          hidden={tab.id !== selected}
          className="min-h-0 overflow-y-auto p-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
