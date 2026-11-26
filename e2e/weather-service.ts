import type { Page, Route } from '@playwright/test';

/** What the place search answers with for "ashev". */
export const places = {
  results: [
    { id: 1, name: 'Asheville', latitude: 35.6, longitude: -82.55, admin1: 'North Carolina', country: 'United States' },
    { id: 2, name: 'Ashevo', latitude: 57.2, longitude: 29.9, admin1: 'Pskov Oblast', country: 'Russia' },
  ],
};

/**
 * A week starting Friday 20 November 2026, measured that morning, in metric
 * units as the app asks for it. Right now it is 2.1 °C (36 °F), feels like
 * −0.6 °C (31 °F), with wind at 7.1 km/h (4 mph).
 */
export function forecast(): Record<string, unknown> {
  const days = Array.from({ length: 7 }, (_, i) => i);
  return {
    current: {
      time: '2026-11-20T09:00',
      temperature_2m: 2.1,
      apparent_temperature: -0.6,
      weather_code: 0,
      wind_speed_10m: 7.1,
      is_day: 1,
    },
    daily: {
      time: days.map((i) => `2026-11-${20 + i}`),
      weather_code: days.map((i) => (i === 2 ? 61 : 0)),
      temperature_2m_max: days.map((i) => 17 + i),
      temperature_2m_min: days.map((i) => -3 + i),
      precipitation_probability_max: days.map((i) => (i === 2 ? 80 : 0)),
    },
  };
}

/**
 * Stands in for everything the app asks of the network, so the tests need
 * none: the weather service, answering as `answers` says, and the map's
 * style, which is given as an empty one.
 */
export class WeatherService {
  /** The addresses the app asked for, in order. */
  readonly searches: URL[] = [];
  readonly forecasts: URL[] = [];

  /** When set, the next requests of that kind are answered with this status and no data. */
  searchStatus = 200;
  forecastStatus = 200;
  searchResults: unknown = places;

  static async standIn(page: Page): Promise<WeatherService> {
    const service = new WeatherService();
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
    );
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      service.searches.push(new URL(route.request().url()));
      return answer(route, service.searchStatus, service.searchResults);
    });
    await page.route('https://api.open-meteo.com/**', (route) => {
      service.forecasts.push(new URL(route.request().url()));
      return answer(route, service.forecastStatus, forecast());
    });
    return service;
  }
}

function answer(route: Route, status: number, body: unknown): Promise<void> {
  return status === 200 ? route.fulfill({ json: body }) : route.fulfill({ status, json: { error: true } });
}
