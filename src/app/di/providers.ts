import { InjectionToken, inject, type Provider } from '@angular/core';

import { OpenMeteoWeatherRepository } from '../data/repositories/open-meteo-weather-repository';
import type { SettingsRepository } from '../domain/repositories/settings-repository';
import type { WeatherRepository } from '../domain/repositories/weather-repository';
import { GetForecast } from '../domain/use-cases/get-forecast';
import { GetUnits } from '../domain/use-cases/get-units';
import { SearchPlaces } from '../domain/use-cases/search-places';
import { SetUnits } from '../domain/use-cases/set-units';
import { HomeViewModel } from '../ui/home/view-models/home.view-model';
import { SearchViewModel } from '../ui/home/view-models/search.view-model';

/*
 * The one place that knows which implementation stands behind each domain
 * interface, and how each use case is built. Everything else asks for the
 * interface.
 */

export const WEATHER_REPOSITORY = new InjectionToken<WeatherRepository>('WEATHER_REPOSITORY');
export const SETTINGS_REPOSITORY = new InjectionToken<SettingsRepository>('SETTINGS_REPOSITORY');

/**
 * The use cases and the view models over them, built on whichever
 * repositories are provided beside these: the real ones, or a test's.
 */
export const appProviders: Provider[] = [
  { provide: SearchPlaces, useFactory: () => new SearchPlaces(inject(WEATHER_REPOSITORY)) },
  { provide: GetForecast, useFactory: () => new GetForecast(inject(WEATHER_REPOSITORY)) },
  { provide: GetUnits, useFactory: () => new GetUnits(inject(SETTINGS_REPOSITORY)) },
  { provide: SetUnits, useFactory: () => new SetUnits(inject(SETTINGS_REPOSITORY)) },
  HomeViewModel,
  SearchViewModel,
];

/**
 * The real repositories: Open-Meteo, and `settings`, which `main.ts` opens
 * before the app starts.
 */
export function repositoryProviders(settings: SettingsRepository): Provider[] {
  return [
    { provide: WEATHER_REPOSITORY, useFactory: () => new OpenMeteoWeatherRepository((url, init) => fetch(url, init)) },
    { provide: SETTINGS_REPOSITORY, useValue: settings },
  ];
}
