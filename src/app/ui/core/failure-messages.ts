import { WeatherError, type WeatherFailure } from '../../domain/repositories/weather-repository';
import { messages } from '../../l10n/messages';

/** What to tell the user about each kind of failure. */
export function failureMessage(failure: WeatherFailure): string {
  return messages.failure[failure];
}

/**
 * The message for whatever was thrown: a `WeatherError`'s own, or a general
 * one for anything unexpected.
 */
export function messageForError(error: unknown): string {
  return error instanceof WeatherError ? failureMessage(error.failure) : messages.failure.unexpected;
}
