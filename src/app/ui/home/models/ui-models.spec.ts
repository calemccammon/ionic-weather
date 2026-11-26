import { placeFromCoordinates } from '../../../domain/models/place';
import { asheville, day, sampleForecast } from '../../../testing/fakes';

import { forecastUiModelFrom } from './forecast-ui-model';
import { placeUiModelFrom } from './place-ui-model';
import { unitsUiModelFrom, unitsUiModelToDomain } from './units-ui-model';

describe('a place', () => {
  const titleOf = (latitude: number, longitude: number) =>
    placeUiModelFrom(placeFromCoordinates(latitude, longitude)).title;

  it('shows its name, with its region and country under it', () => {
    expect(placeUiModelFrom(asheville)).toEqual({
      title: 'Asheville',
      subtitle: 'North Carolina, United States',
      latitude: 35.6,
      longitude: -82.55,
    });
  });

  it('leaves whatever is missing out of the line under the name', () => {
    expect(
      placeUiModelFrom({ name: 'Sydney', latitude: -33.87, longitude: 151.21, country: 'Australia' }).subtitle,
    ).toBe('Australia');
    expect(placeUiModelFrom({ name: 'Null Island', latitude: 0, longitude: 0 }).subtitle).toBe('');
  });

  it.each([
    [35.6, -82.55, '35.60°N, 82.55°W'],
    [-33.868, 151.209, '33.87°S, 151.21°E'],
    [0.05, 9, '0.05°N, 9.00°E'],
  ])('with no name is called by its coordinates (%d, %d)', (latitude, longitude, title) => {
    expect(titleOf(latitude, longitude)).toBe(title);
    expect(placeUiModelFrom(placeFromCoordinates(latitude, longitude)).subtitle).toBe('');
  });

  it.each([
    [0, 0, '0.00°N, 0.00°E'],
    [-0.001, -0.004, '0.00°N, 0.00°E'],
    [-0.006, -0.0051, '0.01°S, 0.01°W'],
  ])(
    'a hair off the equator or Greenwich is on the same side as the line itself (%d, %d)',
    (latitude, longitude, title) => {
      expect(titleOf(latitude, longitude)).toBe(title);
    },
  );
});

describe('the units choice', () => {
  it('stands for one system of units, and back', () => {
    expect(unitsUiModelFrom('metric')).toBe('celsius');
    expect(unitsUiModelFrom('imperial')).toBe('fahrenheit');
    expect(unitsUiModelToDomain(unitsUiModelFrom('metric'))).toBe('metric');
    expect(unitsUiModelToDomain(unitsUiModelFrom('imperial'))).toBe('imperial');
  });
});

describe('a forecast', () => {
  const word = (forecast = sampleForecast(), units: 'metric' | 'imperial' = 'imperial') =>
    forecastUiModelFrom(forecast, units, 'en-US');

  it('rounds and words the current conditions in imperial units', () => {
    expect(word().current).toEqual({
      icon: 'sunny',
      temperature: '36°F',
      condition: 'Clear',
      feelsLike: 'Feels like 31°',
      wind: 'Wind 4 mph',
      description: 'Now: Clear, 36 degrees Fahrenheit, feels like 31, wind 4 mph',
    });
  });

  it('words the current conditions in metric units, and draws the night sky at night', () => {
    const current = word(sampleForecast({ isDay: false }), 'metric').current;

    expect(current.temperature).toBe('2°C');
    expect(current.feelsLike).toBe('Feels like -1°');
    expect(current.wind).toBe('Wind 7 km/h');
    expect(current.description).toBe('Now: Clear, 2 degrees Celsius, feels like -1, wind 7 km/h');
    expect(current.icon).toBe('moon');
  });

  it('calls the day the forecast was made on today, and names the rest', () => {
    expect(word().days.map((each) => each.dayLabel)).toEqual(['Today', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
  });

  it("goes by the place's own date, whatever the device's clock says", () => {
    // Measured late on the 21st there, in a list that starts with the 20th.
    const forecast = sampleForecast({ observedAt: '2026-11-21T23:30' });

    expect(
      word(forecast)
        .days.map((each) => each.dayLabel)
        .slice(0, 3),
    ).toEqual(['Fri', 'Today', 'Sun']);
  });

  it("shows a day's rounded low and high, and its chance of precipitation if it has one", () => {
    const [today, , sunday] = word().days;

    expect([today?.low, today?.high, today?.chance]).toEqual(['27°', '63°', '']);
    expect(sunday?.chance).toBe('80%');
    expect(sunday?.icon).toBe('rainy');
  });

  it('makes each day one sentence for a screen reader', () => {
    const [today, , sunday] = word().days;

    expect(today?.description).toBe('Today: Clear, low 27, high 63 degrees');
    expect(sunday?.description).toBe('Sunday: Rain, low 30, high 66 degrees, 80 percent chance of precipitation');
  });

  it("shows where each day's range sits in the week's", () => {
    // The week runs from 20 to 60.
    const days = word(sampleForecast({ days: [day(20, 20, 40), day(21, 30, 60), day(22, 50, 50)] })).days;

    expect(days.map((each) => [each.barStart, each.barEnd])).toEqual([
      [0, 0.5],
      [0.25, 1],
      [0.75, 0.75],
    ]);
  });

  it('fills every bar in a week of one temperature', () => {
    const [only] = word(sampleForecast({ days: [day(20, 50, 50)] })).days;

    expect([only?.barStart, only?.barEnd]).toEqual([0, 1]);
  });

  it('has no days to show when the service sent none', () => {
    expect(word(sampleForecast({ days: [] })).days).toEqual([]);
  });
});
