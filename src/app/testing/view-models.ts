import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { appProviders, SETTINGS_REPOSITORY, WEATHER_REPOSITORY } from '../di/providers';
import { DEVICE_COUNTRY } from '../ui/core/device';
import { HomeViewModel } from '../ui/home/view-models/home.view-model';
import { SearchViewModel } from '../ui/home/view-models/search.view-model';

import { FakeSettingsRepository, FakeWeatherRepository } from './fakes';

export interface ViewModels {
  readonly weather: FakeWeatherRepository;
  readonly settings: FakeSettingsRepository;
  readonly home: HomeViewModel;
  readonly search: SearchViewModel;
}

/** The view models, wired as the app wires them, over repositories the test controls. */
export function makeViewModels(
  options: { settings?: FakeSettingsRepository; deviceCountry?: string | null } = {},
): ViewModels {
  const weather = new FakeWeatherRepository();
  const settings = options.settings ?? new FakeSettingsRepository();
  TestBed.configureTestingModule({
    providers: [
      ...appProviders,
      { provide: WEATHER_REPOSITORY, useValue: weather },
      { provide: SETTINGS_REPOSITORY, useValue: settings },
      { provide: DEVICE_COUNTRY, useValue: options.deviceCountry === undefined ? 'US' : options.deviceCountry },
      { provide: LOCALE_ID, useValue: 'en-US' },
    ],
  });
  return { weather, settings, home: TestBed.inject(HomeViewModel), search: TestBed.inject(SearchViewModel) };
}
