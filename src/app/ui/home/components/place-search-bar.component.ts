import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonProgressBar, IonSearchbar } from '@ionic/angular';

import { messages } from '../../../l10n/messages';
import type { SearchState } from '../models/search-state';

/**
 * A search bar that opens into a list of matching places.
 *
 * Closed, it shows the selected place's name. Open, it holds what is being
 * typed and shows `search` under itself. It does no searching of its own: it
 * reports what was typed and which row was chosen.
 */
@Component({
  selector: 'app-place-search-bar',
  templateUrl: 'place-search-bar.component.html',
  styleUrl: 'place-search-bar.component.scss',
  imports: [IonButton, IonIcon, IonItem, IonLabel, IonList, IonProgressBar, IonSearchbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceSearchBarComponent {
  /** The selected place's name, or null when no place is selected. */
  readonly placeTitle = input<string | null>(null);
  readonly search = input.required<SearchState>();
  /** Whether the bar is open for typing, with its results under it. */
  readonly open = model(false);

  readonly queryChange = output<string>();
  /** The row of the results the user chose. */
  readonly choose = output<number>();
  readonly retry = output<void>();
  /** The user pressed the button that deselects the place. */
  readonly clearPlace = output<void>();

  protected readonly m = messages;

  /** What has been typed since the bar opened. */
  protected readonly typed = signal('');

  /** What the bar shows: what is being typed, or the place's name. */
  protected readonly text = computed(() => (this.open() ? this.typed() : (this.placeTitle() ?? '')));

  protected onFocus(): void {
    if (this.open()) return;
    // Opening starts from an empty search: the place's name is a label, not
    // something to search for.
    this.typed.set('');
    this.open.set(true);
  }

  protected onInput(value: string | null | undefined): void {
    this.typed.set(value ?? '');
    this.queryChange.emit(value ?? '');
  }

  protected onClear(): void {
    if (this.open()) return;
    this.clearPlace.emit();
  }

  protected onChoose(index: number): void {
    this.choose.emit(index);
    this.open.set(false);
  }
}
