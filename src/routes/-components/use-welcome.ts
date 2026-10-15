import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/shared/hooks/prefers-reduced-motion';

const WELCOMED = 'climbspot.welcomed';
/** As long as the welcome screen's fade lasts. */
const FADE_MS = 300;

function wasWelcomed(): boolean {
  try {
    return localStorage.getItem(WELCOMED) === 'yes';
  } catch {
    return false;
  }
}

function rememberWelcomed() {
  try {
    localStorage.setItem(WELCOMED, 'yes');
  } catch {
    // Blocked storage: the welcome screen shows again next time, which is harmless.
  }
}

/**
 * The welcome screen: shown on a first visit and whenever asked for (the logo), lifted
 * by either way in, then remembered so that later visits open on the map.
 */
export function useWelcome(asked: boolean, onClosed: () => void) {
  const [welcomed, setWelcomed] = useState(wasWelcomed);
  const [closing, setClosing] = useState(false);
  const fade = useRef<ReturnType<typeof setTimeout>>(undefined);
  const afterClose = useRef<() => void>(undefined);
  const open = asked || !welcomed || closing;

  // Leaving the page mid-fade must not finish closing (and navigate) afterwards.
  useEffect(
    () => () => {
      clearTimeout(fade.current);
    },
    [],
  );

  // Once lifted, the map and panel take input again: only then can they take the focus.
  useEffect(() => {
    if (!open && afterClose.current) {
      afterClose.current();
      afterClose.current = undefined;
    }
  }, [open]);

  const close = (then: () => void) => {
    if (closing) {
      return;
    }
    rememberWelcomed();
    afterClose.current = then;
    const done = () => {
      setWelcomed(true);
      setClosing(false);
      onClosed();
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    setClosing(true);
    fade.current = setTimeout(done, FADE_MS);
  };

  return { open, closing, close };
}
