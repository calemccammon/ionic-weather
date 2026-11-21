import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton, IonIcon, IonProgressBar, IonSegment, IonSegmentButton } from '@ionic/angular';

import { messages } from '../../../l10n/messages';
import type { HomeState } from '../models/home-state';
import type { UnitsUiModel } from '../models/units-ui-model';

/**
 * Current conditions and the week ahead for the selected place. It scrolls,
 * so it can live inside the bottom sheet or the side panel.
 */
@Component({
  selector: 'app-forecast-panel',
  templateUrl: 'forecast-panel.component.html',
  styleUrl: 'forecast-panel.component.scss',
  imports: [IonButton, IonIcon, IonProgressBar, IonSegment, IonSegmentButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastPanelComponent {
  readonly state = input.required<HomeState>();
  readonly unitsChange = output<UnitsUiModel>();
  readonly retry = output<void>();

  protected readonly m = messages;

  protected onUnitsChange(value: unknown): void {
    if (value === 'celsius' || value === 'fahrenheit') this.unitsChange.emit(value);
  }
}
