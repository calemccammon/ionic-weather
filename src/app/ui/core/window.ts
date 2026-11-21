import { DestroyRef, inject, signal, type Signal } from '@angular/core';

/**
 * Whether `query`, a CSS media query, matches, kept up to date as the window
 * or the system's settings change. Call it while a component is being made.
 */
export function mediaQuery(query: string): Signal<boolean> {
  const list = window.matchMedia(query);
  const matches = signal(list.matches);
  const update = () => matches.set(list.matches);
  list.addEventListener('change', update);
  inject(DestroyRef).onDestroy(() => list.removeEventListener('change', update));
  return matches.asReadonly();
}

/** The window's height in pixels, kept up to date. Call it while a component is being made. */
export function windowHeight(): Signal<number> {
  const height = signal(window.innerHeight);
  const update = () => height.set(window.innerHeight);
  window.addEventListener('resize', update);
  inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', update));
  return height.asReadonly();
}
