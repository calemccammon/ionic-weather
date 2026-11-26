import {
  inUnits,
  isToday,
  type CurrentConditions,
  type DailyForecast,
  type Forecast,
} from '../../../domain/models/forecast';
import type { Units } from '../../../domain/models/units';
import { messages } from '../../../l10n/messages';
import { conditionIcon, conditionLabel, type IconName } from '../../core/weather-condition-ui';

/**
 * The forecast as the screen shows it: every value already rounded, worded
 * and laid out, so the components only place it.
 */
export interface ForecastUiModel {
  readonly current: CurrentUiModel;
  readonly days: readonly DayUiModel[];
}

/** The "right now" block at the top of the forecast. */
export interface CurrentUiModel {
  readonly icon: IconName;
  /**
   * "34°F". The one place the scale is spelled out; the rest of the forecast
   * is in the same one.
   */
  readonly temperature: string;
  /** "Overcast". */
  readonly condition: string;
  /** "Feels like 28°". */
  readonly feelsLike: string;
  /** "Wind 2 mph". */
  readonly wind: string;
  /** The whole block as one sentence for a screen reader. */
  readonly description: string;
}

/** One row of the week. */
export interface DayUiModel {
  /** The row's identity in the list: its date. */
  readonly key: string;
  /**
   * "Today" for the day the forecast was made on, otherwise a short weekday:
   * "Sat".
   */
  readonly dayLabel: string;
  readonly icon: IconName;
  /** "47%", or empty when there is no chance worth showing. */
  readonly chance: string;
  /** "30°". */
  readonly low: string;
  /** "68°". */
  readonly high: string;
  /**
   * Where this day's low and high fall within the week's range, each from 0
   * (the week's lowest) to 1 (its highest).
   */
  readonly barStart: number;
  readonly barEnd: number;
  /** The whole row as one sentence for a screen reader. */
  readonly description: string;
}

/**
 * Translates a domain forecast, held in metric units, for display in `units`.
 * Weekdays are named in `language`, such as "en-US".
 */
export function forecastUiModelFrom(metric: Forecast, units: Units, language: string): ForecastUiModel {
  // Converted before anything is rounded.
  const forecast = inUnits(metric, units);
  const { days } = forecast;
  // The whole week's range, so each day's bar shows where it sits in it.
  const weekLow = days.length === 0 ? 0 : Math.min(...days.map((day) => day.low));
  const weekHigh = days.length === 0 ? 0 : Math.max(...days.map((day) => day.high));

  return {
    current: currentUiModelFrom(forecast.current, units),
    days: days.map((day) => dayUiModelFrom(day, { isToday: isToday(forecast, day), weekLow, weekHigh }, language)),
  };
}

/** Words current conditions already in `units`. */
export function currentUiModelFrom(current: CurrentConditions, units: Units): CurrentUiModel {
  const degrees = Math.round(current.temperature);
  const feelsLike = Math.round(current.feelsLike);
  const wind = Math.round(current.windSpeed);
  const metric = units === 'metric';
  const speed = metric ? messages.speed.kmh(wind) : messages.speed.mph(wind);
  const condition = conditionLabel(current.condition);
  const spoken = metric ? messages.temperature.spokenCelsius(degrees) : messages.temperature.spokenFahrenheit(degrees);

  return {
    icon: conditionIcon(current.condition, current.isDay),
    temperature: metric ? messages.temperature.celsius(degrees) : messages.temperature.fahrenheit(degrees),
    condition,
    feelsLike: messages.temperature.feelsLike(feelsLike),
    wind: messages.wind(speed),
    description: messages.spoken.current(condition, spoken, feelsLike, speed),
  };
}

export function dayUiModelFrom(
  day: DailyForecast,
  week: { isToday: boolean; weekLow: number; weekHigh: number },
  language: string,
): DayUiModel {
  const low = Math.round(day.low);
  const high = Math.round(day.high);
  const percent = day.precipitationChance ?? 0;
  const span = week.weekHigh - week.weekLow;
  const condition = conditionLabel(day.condition);
  const dayName = week.isToday ? messages.today : weekday(day.date, language, 'long');

  return {
    key: day.date,
    dayLabel: week.isToday ? messages.today : weekday(day.date, language, 'short'),
    icon: conditionIcon(day.condition),
    chance: percent > 0 ? messages.precipitationChance(percent) : '',
    low: messages.temperature.plain(low),
    high: messages.temperature.plain(high),
    // A week with one temperature throughout fills the whole bar.
    barStart: span <= 0 ? 0 : (day.low - week.weekLow) / span,
    barEnd: span <= 0 ? 1 : (day.high - week.weekLow) / span,
    description:
      percent > 0
        ? messages.spoken.dayWithChance(dayName, condition, low, high, percent)
        : messages.spoken.day(dayName, condition, low, high),
  };
}

/**
 * The weekday of an ISO date such as `2026-11-21`, in `language`. The date is
 * a calendar day with no timezone, so it is read and formatted in UTC and
 * the device's own timezone cannot shift it.
 */
function weekday(date: string, language: string, length: 'short' | 'long'): string {
  return new Intl.DateTimeFormat(language, { weekday: length, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
