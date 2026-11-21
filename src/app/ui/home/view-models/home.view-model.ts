import { inject, Injectable, LOCALE_ID, signal, type Signal } from '@angular/core';

import type { Forecast } from '../../../domain/models/forecast';
import { placeFromCoordinates, type Place } from '../../../domain/models/place';
import type { Units } from '../../../domain/models/units';
import { GetForecast } from '../../../domain/use-cases/get-forecast';
import { GetUnits } from '../../../domain/use-cases/get-units';
import { SetUnits } from '../../../domain/use-cases/set-units';
import { DEVICE_COUNTRY } from '../../core/device';
import { messageForError } from '../../core/failure-messages';
import { forecastUiModelFrom } from '../models/forecast-ui-model';
import type { ForecastState, HomeState } from '../models/home-state';
import { placeUiModelFrom, type PlaceUiModel } from '../models/place-ui-model';
import { unitsUiModelFrom, unitsUiModelToDomain, type UnitsUiModel } from '../models/units-ui-model';

/**
 * Holds the selected place and the chosen units, and loads the forecast.
 *
 * Selecting a place while an earlier forecast is still on its way throws the
 * earlier answer away when it arrives.
 */
@Injectable()
export class HomeViewModel {
  private readonly getForecast = inject(GetForecast);
  private readonly saveUnits = inject(SetUnits);
  private readonly language = inject(LOCALE_ID);

  private place: Place | null = null;
  private units: Units = inject(GetUnits).execute(inject(DEVICE_COUNTRY));

  /**
   * Counts forecast requests, so an answer can tell whether it is still the
   * newest one.
   */
  private request = 0;

  private readonly current = signal<HomeState>({
    units: unitsUiModelFrom(this.units),
    place: null,
    forecast: { kind: 'idle' },
  });

  /** What the screen shows. */
  readonly state: Signal<HomeState> = this.current.asReadonly();

  /** Makes `place` the selected place and loads its forecast. */
  select(place: Place): void {
    this.place = place;
    void this.load(placeUiModelFrom(place));
  }

  /** Selects a point picked straight off the map. */
  selectPoint(latitude: number, longitude: number): void {
    this.select(placeFromCoordinates(latitude, longitude));
  }

  clear(): void {
    this.place = null;
    this.request++;
    this.current.set({ units: unitsUiModelFrom(this.units), place: null, forecast: { kind: 'idle' } });
  }

  /**
   * Shows forecasts in `units` from now on, and remembers the choice. The
   * forecast on screen is asked for again in them.
   */
  setUnits(units: UnitsUiModel): void {
    const chosen = unitsUiModelToDomain(units);
    if (chosen === this.units) return;
    this.units = chosen;
    // Not saved means the next launch starts from the old choice; this one
    // carries on with the new.
    this.saveUnits.execute(chosen).catch(() => undefined);

    const shown = this.current().place;
    if (shown === null) {
      this.current.update((state) => ({ ...state, units }));
    } else {
      // The same place as before, so the map has no reason to move.
      void this.load(shown);
    }
  }

  /** Asks for the selected place's forecast again, after a failure. */
  retryForecast(): void {
    const shown = this.current().place;
    if (shown !== null) void this.load(shown);
  }

  private async load(shown: PlaceUiModel): Promise<void> {
    const place = this.place;
    if (place === null) return;
    const request = ++this.request;
    const units = this.units;
    this.show(shown, units, { kind: 'loading' });

    let outcome: ForecastState;
    try {
      outcome = { kind: 'loaded', forecast: this.word(await this.getForecast.execute(place, units), units) };
    } catch (error) {
      outcome = { kind: 'failed', message: messageForError(error) };
    }
    if (request === this.request) this.show(shown, units, outcome);
  }

  private word(forecast: Forecast, units: Units) {
    return forecastUiModelFrom(forecast, units, this.language);
  }

  private show(place: PlaceUiModel, units: Units, forecast: ForecastState): void {
    this.current.set({ units: unitsUiModelFrom(units), place, forecast });
  }
}
