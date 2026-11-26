import { WeatherError } from '../../../domain/repositories/weather-repository';
import { asheville, ashford, FakeSettingsRepository, sampleForecast, settle } from '../../../testing/fakes';
import { makeViewModels, type ViewModels } from '../../../testing/view-models';

/** The temperature on screen, or null when no forecast is. */
function temperature(home: ViewModels['home']): string | null {
  const forecast = home.state().forecast;
  return forecast.kind === 'loaded' ? forecast.forecast.current.temperature : null;
}

it("starts with no place, in the units of the device's country", () => {
  expect(makeViewModels({ deviceCountry: 'US' }).home.state()).toEqual({
    units: 'fahrenheit',
    place: null,
    forecast: { kind: 'idle' },
  });
});

it('starts in Celsius where the device says another country, or none', () => {
  expect(makeViewModels({ deviceCountry: null }).home.state().units).toBe('celsius');
});

it("starts in the units the user chose before, whatever the device's country", () => {
  const { home } = makeViewModels({ settings: new FakeSettingsRepository('metric'), deviceCountry: 'US' });

  expect(home.state().units).toBe('celsius');
});

it('shows a selected place at once, and its forecast when that arrives', async () => {
  const { home, weather } = makeViewModels();

  home.select(asheville);

  expect(home.state().place?.title).toBe('Asheville');
  expect(home.state().forecast).toEqual({ kind: 'loading' });

  weather.forecasts[0]?.resolve(sampleForecast());
  await settle();

  expect(temperature(home)).toBe('36°F');
  expect(weather.forecastRequests).toEqual([{ latitude: 35.6, longitude: -82.55 }]);
});

it('selects a point picked off the map by its coordinates', async () => {
  const { home, weather } = makeViewModels();

  home.selectPoint(35.6, 277.45);

  expect(home.state().place?.title).toBe('35.60°N, 82.55°W');
  expect(weather.forecastRequests[0]?.longitude).toBeCloseTo(-82.55, 9);
});

it('words a failure for the user, and can succeed on another try', async () => {
  const { home, weather } = makeViewModels();
  weather.failure = new WeatherError('timeout');

  home.select(asheville);
  await settle();

  expect(home.state().forecast).toEqual({
    kind: 'failed',
    message: 'The weather service took too long to answer.',
  });
  expect(home.state().place?.title).toBe('Asheville');

  weather.failure = undefined;
  weather.forecastToReturn = sampleForecast();
  home.retryForecast();

  expect(home.state().forecast).toEqual({ kind: 'loading' });
  await settle();
  expect(temperature(home)).toBe('36°F');
});

it.each([
  ['answer', (weather: ViewModels['weather']) => weather.forecasts[0]?.resolve(sampleForecast())],
  ['failure', (weather: ViewModels['weather']) => weather.forecasts[0]?.reject(new WeatherError('timeout'))],
])('never shows the %s for a place left behind over the newer place', async (_, settleFirst) => {
  const { home, weather } = makeViewModels();

  home.select(asheville);
  home.select(ashford);
  settleFirst(weather);
  await settle();

  expect(home.state().place?.title).toBe('Ashford');
  expect(home.state().forecast).toEqual({ kind: 'loading' });

  weather.forecasts[1]?.resolve(sampleForecast());
  await settle();

  expect(temperature(home)).toBe('36°F');
});

it('goes back to the start when the place is cleared, and drops the forecast on its way', async () => {
  const { home, weather } = makeViewModels();
  home.select(asheville);

  home.clear();
  weather.forecasts[0]?.resolve(sampleForecast());
  await settle();

  expect(home.state()).toEqual({ units: 'fahrenheit', place: null, forecast: { kind: 'idle' } });
});

it('shows the forecast already held in other units, without asking again, and remembers the choice', async () => {
  const { home, weather, settings } = makeViewModels();
  weather.forecastToReturn = sampleForecast();
  home.select(asheville);
  await settle();
  const place = home.state().place;
  expect(temperature(home)).toBe('36°F');

  home.setUnits('celsius');

  // At once: no loading, no request.
  expect(home.state().units).toBe('celsius');
  expect(temperature(home)).toBe('2°C');
  // The very same place, so the map has no reason to move.
  expect(home.state().place).toBe(place);
  await settle();
  expect(weather.forecastRequests).toHaveLength(1);
  expect(settings.saved).toEqual(['metric']);

  home.setUnits('fahrenheit');

  expect(temperature(home)).toBe('36°F');
  expect(weather.forecastRequests).toHaveLength(1);
});

it('shows a forecast still on its way in the units chosen meanwhile', async () => {
  const { home, weather } = makeViewModels();
  home.select(asheville);

  home.setUnits('celsius');
  expect(home.state().forecast).toEqual({ kind: 'loading' });
  weather.forecasts[0]?.resolve(sampleForecast());
  await settle();

  expect(temperature(home)).toBe('2°C');
  expect(weather.forecastRequests).toHaveLength(1);
});

it('does nothing when the units already shown are chosen', async () => {
  const { home, weather, settings } = makeViewModels();
  weather.forecastToReturn = sampleForecast();
  home.select(asheville);
  await settle();

  home.setUnits('fahrenheit');
  await settle();

  expect(weather.forecastRequests).toHaveLength(1);
  expect(settings.saved).toEqual([]);
});

it('lets units be chosen before any place is', async () => {
  const { home, weather } = makeViewModels();

  home.setUnits('celsius');
  await settle();

  expect(home.state()).toEqual({ units: 'celsius', place: null, forecast: { kind: 'idle' } });
  expect(weather.forecastRequests).toEqual([]);
});

it('still uses units that could not be saved, for now', async () => {
  const { home, weather, settings } = makeViewModels();
  settings.failure = new Error('The store is full.');
  weather.forecastToReturn = sampleForecast();
  home.select(asheville);
  await settle();

  home.setUnits('celsius');
  await settle();

  expect(temperature(home)).toBe('2°C');
  expect(settings.saved).toEqual([]);
});

it('has nothing to try again with no place selected', async () => {
  const { home, weather } = makeViewModels();

  home.retryForecast();
  await settle();

  expect(weather.forecastRequests).toEqual([]);
  expect(home.state().forecast).toEqual({ kind: 'idle' });
});
