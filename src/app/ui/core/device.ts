import { InjectionToken } from '@angular/core';

/** The country the device is set to, such as "US", or null if it does not say. */
export const DEVICE_COUNTRY = new InjectionToken<string | null>('DEVICE_COUNTRY', {
  factory: () => {
    try {
      return new Intl.Locale(navigator.language).region ?? null;
    } catch {
      // A language tag the browser itself cannot read.
      return null;
    }
  },
});
