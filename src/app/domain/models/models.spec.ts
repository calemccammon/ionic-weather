import { day, sampleForecast } from '../../testing/fakes';

import { inUnits, isToday } from './forecast';
import { normalizeLongitude, placeFromCoordinates } from './place';
import { unitsForCountry } from './units';

describe('a place', () => {
  it('picked off the map has no name', () => {
    expect(placeFromCoordinates(35.6, -82.55)).toEqual({ latitude: 35.6, longitude: -82.55 });
  });

  it('picked off a map dragged round the world has its longitude brought back', () => {
    const place = placeFromCoordinates(35.6, -82.55 + 360);

    expect(place.longitude).toBeCloseTo(-82.55, 9);
  });
});

describe('normalizeLongitude', () => {
  it.each([
    [0, 0],
    [179, 179],
    [180, -180],
    [-180, -180],
    [190, -170],
    [-190, 170],
    [360, 0],
    [725, 5],
    [-725, -5],
  ])('brings %d to %d', (longitude, expected) => {
    expect(normalizeLongitude(longitude)).toBeCloseTo(expected, 9);
  });
});

describe('units', () => {
  it('are imperial in the three countries that use them, and metric elsewhere', () => {
    expect(['US', 'LR', 'MM'].map(unitsForCountry)).toEqual(['imperial', 'imperial', 'imperial']);
    expect(unitsForCountry('GB')).toBe('metric');
    expect(unitsForCountry(null)).toBe('metric');
    expect(unitsForCountry(undefined)).toBe('metric');
  });
});

describe('a forecast', () => {
  it("knows which day is the place's own today", () => {
    const forecast = sampleForecast({ observedAt: '2026-11-21T23:30' });

    expect(forecast.days.map((each) => isToday(forecast, each))).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('a forecast in other units', () => {
  const metric = sampleForecast({ days: [{ ...day(20, 0, 10), precipitationChance: 46 }, day(21, -40, 100)] });
  const imperial = inUnits(
    { ...metric, current: { ...metric.current, temperature: 10, feelsLike: -40, windSpeed: 20 } },
    'imperial',
  );

  it('has its temperatures in Fahrenheit', () => {
    expect(imperial.current.temperature).toBeCloseTo(50, 9);
    expect(imperial.current.feelsLike).toBeCloseTo(-40, 9);
    expect(imperial.days.map((each) => [each.low, each.high])).toEqual([
      [32, expect.closeTo(50, 9)],
      [expect.closeTo(-40, 9), expect.closeTo(212, 9)],
    ]);
  });

  it('has its wind in miles an hour, and keeps everything else', () => {
    expect(imperial.current.windSpeed).toBeCloseTo(12.43, 2);
    expect(imperial.current.condition).toBe(metric.current.condition);
    expect(imperial.current.observedAt).toBe(metric.current.observedAt);
    expect(imperial.days.map((each) => [each.date, each.condition, each.precipitationChance])).toEqual([
      ['2026-11-20', 'overcast', 46],
      ['2026-11-21', 'overcast', undefined],
    ]);
  });

  it('is the same forecast in metric, since it is held in metric', () => {
    expect(inUnits(metric, 'metric')).toEqual(metric);
  });
});
