import { useState } from 'react';

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

  const close = (then: () => void) => {
    rememberWelcomed();
    const done = () => {
      setWelcomed(true);
      setClosing(false);
      onClosed();
      // Once the map and panel take input again.
      setTimeout(then, 0);
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    setClosing(true);
    setTimeout(done, FADE_MS);
  };

  return { open: asked || !welcomed || closing, closing, close };
}
