import type { ForecastUiModel } from './forecast-ui-model';
import type { PlaceUiModel } from './place-ui-model';
import type { UnitsUiModel } from './units-ui-model';

/**
 * What the forecast area is showing. `idle` means no place is selected, so
 * there is nothing to forecast.
 */
export type ForecastState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'loaded'; readonly forecast: ForecastUiModel }
  | { readonly kind: 'failed'; readonly message: string };

/**
 * What the home screen is showing: the selected place, if any, where its
 * forecast has got to, and the units it is in.
 */
export interface HomeState {
  readonly units: UnitsUiModel;
  readonly place: PlaceUiModel | null;
  readonly forecast: ForecastState;
}
