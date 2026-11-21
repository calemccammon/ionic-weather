import type { WeatherCondition } from '../../domain/models/weather-condition';
import { messages } from '../../l10n/messages';

/** How a weather condition is worded. */
export function conditionLabel(condition: WeatherCondition): string {
  return messages.condition[condition];
}

/** The name of an icon in `icons.ts`. */
export type IconName = string;

const conditionIcons: Readonly<Record<WeatherCondition, IconName | { day: IconName; night: IconName }>> = {
  clear: { day: 'sunny', night: 'moon' },
  mostlyClear: { day: 'sunny', night: 'moon' },
  partlyCloudy: { day: 'partly-sunny', night: 'cloudy-night' },
  overcast: 'cloud',
  fog: 'reorder-three',
  drizzle: 'water',
  freezingDrizzle: 'water',
  rain: 'rainy',
  freezingRain: 'rainy',
  snow: 'snow',
  rainShowers: 'umbrella',
  snowShowers: 'snow',
  thunderstorm: 'thunderstorm',
  unknown: 'help-circle-outline',
};

/** How a weather condition is drawn. Clear and partly cloudy skies differ at night. */
export function conditionIcon(condition: WeatherCondition, isDay = true): IconName {
  const icon = conditionIcons[condition];
  if (typeof icon === 'string') return icon;
  return isDay ? icon.day : icon.night;
}
