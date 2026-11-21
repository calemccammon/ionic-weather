import type { WeatherCondition } from '../../domain/models/weather-condition';
import { WeatherError, type WeatherFailure } from '../../domain/repositories/weather-repository';

import { failureMessage, messageForError } from './failure-messages';
import { conditionIcon, conditionLabel } from './weather-condition-ui';

const failures: WeatherFailure[] = [
  'timeout',
  'noConnection',
  'badResponse',
  'rejected',
  'unavailable',
  'invalidPlace',
];
const conditions: WeatherCondition[] = [
  'clear',
  'mostlyClear',
  'partlyCloudy',
  'overcast',
  'fog',
  'drizzle',
  'freezingDrizzle',
  'rain',
  'freezingRain',
  'snow',
  'rainShowers',
  'snowShowers',
  'thunderstorm',
  'unknown',
];

it('has its own message for every failure', () => {
  expect(new Set(failures.map(failureMessage)).size).toBe(failures.length);
  expect(failureMessage('timeout')).toBe('The weather service took too long to answer.');
  expect(failureMessage('invalidPlace')).toBe('That point is not on the map.');
});

it('words a weather error by its kind, and anything else as something gone wrong', () => {
  expect(messageForError(new WeatherError('rejected'))).toBe('The weather service refused the request.');
  expect(messageForError(new TypeError('boom'))).toBe('Something went wrong. Please try again.');
});

it('has its own name for every condition', () => {
  expect(new Set(conditions.map(conditionLabel)).size).toBe(conditions.length);
  expect(conditionLabel('partlyCloudy')).toBe('Partly cloudy');
  expect(conditionLabel('freezingDrizzle')).toBe('Freezing drizzle');
});

it('draws clear and partly cloudy skies differently at night', () => {
  expect(conditionIcon('clear', true)).not.toBe(conditionIcon('clear', false));
  expect(conditionIcon('partlyCloudy', true)).not.toBe(conditionIcon('partlyCloudy', false));
  expect(conditionIcon('rain', true)).toBe(conditionIcon('rain', false));
});
