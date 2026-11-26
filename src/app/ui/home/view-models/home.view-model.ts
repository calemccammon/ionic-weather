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
 * The forecast is held as it came, in metric units, and converted for the
 * screen; changing units words it again without asking for it again.
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
  /** The forecast on screen, in metric units, or null when none is. */
  private held: Forecast | null = null;

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
    this.held = null;
    this.request++;
    this.current.set({ units: unitsUiModelFrom(this.units), place: null, forecast: { kind: 'idle' } });
  }

  /**
   * Shows forecasts in `units` from now on, and remembers the choice. The
   * forecast on screen is converted at once, with no new request.
   */
  setUnits(units: UnitsUiModel): void {
    const chosen = unitsUiModelToDomain(units);
    if (chosen === this.units) return;
    this.units = chosen;
    // Not saved means the next launch starts from the old choice; this one
    // carries on with the new.
    this.saveUnits.execute(chosen).catch(() => undefined);

    const state = this.current();
    if (state.place !== null && state.forecast.kind === 'loaded' && this.held !== null) {
      // The same place as before, so the map has no reason to move.
      this.show(state.place, chosen, { kind: 'loaded', forecast: this.word(this.held, chosen) });
    } else {
      // A forecast still on its way is worded in these units when it comes.
      this.current.update((each) => ({ ...each, units }));
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
    this.held = null;
    this.show(shown, this.units, { kind: 'loading' });

    let forecast: Forecast | null = null;
    let outcome: ForecastState;
    try {
      forecast = await this.getForecast.execute(place);
      outcome = { kind: 'loaded', forecast: this.word(forecast, this.units) };
    } catch (error) {
      outcome = { kind: 'failed', message: messageForError(error) };
    }
    if (request !== this.request) return;
    this.held = forecast;
    this.show(shown, this.units, outcome);
  }

  private word(forecast: Forecast, units: Units) {
    return forecastUiModelFrom(forecast, units, this.language);
  }

  private show(place: PlaceUiModel, units: Units, forecast: ForecastState): void {
    this.current.set({ units: unitsUiModelFrom(units), place, forecast });
  }
}
