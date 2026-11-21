import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonModal } from '@ionic/angular';

import { messages } from '../../l10n/messages';
import { mediaQuery, windowHeight } from '../core/window';

import { ForecastPanelComponent } from './components/forecast-panel.component';
import { PlaceSearchBarComponent } from './components/place-search-bar.component';
import { WeatherMapComponent, type MapInsets, type MapPin } from './components/weather-map.component';
import { HomeViewModel } from './view-models/home.view-model';
import { SearchViewModel } from './view-models/search.view-model';

/** Material's "expanded" window width: room for a panel beside the map. */
const expandedBreakpointPx = 840;

const sidePanelWidthPx = 400;

/** The height of the search bar, and the gaps round it and under it. */
const searchBarHeightPx = 56;
const marginPx = 16;
const gapPx = 12;

/** How much of the screen's height the bottom sheet takes: tucked away, at rest, pulled right up. */
const sheetStops = { collapsed: 0.12, resting: 0.3, expanded: 0.85 } as const;

/**
 * The app's one screen: a map, a search bar over it, and the forecast for
 * the selected place.
 *
 * On a phone the forecast is a bottom sheet that drags up over the map. From
 * Material's "expanded" window width up, it is a panel at the side.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrl: 'home.page.scss',
  imports: [IonContent, IonModal, ForecastPanelComponent, PlaceSearchBarComponent, WeatherMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly home = inject(HomeViewModel);
  protected readonly search = inject(SearchViewModel);

  protected readonly m = messages;
  protected readonly sheetStops = sheetStops;
  protected readonly sheetBreakpoints = Object.values(sheetStops);

  protected readonly searchOpen = signal(false);
  protected readonly isWide = mediaQuery(`(min-width: ${expandedBreakpointPx}px)`);
  protected readonly dark = mediaQuery('(prefers-color-scheme: dark)');
  private readonly height = windowHeight();

  protected readonly pin = computed<MapPin | null>(() => {
    const place = this.home.state().place;
    return place === null ? null : { latitude: place.latitude, longitude: place.longitude };
  });

  /**
   * What covers the map, so the selected place can be shown in the clear. It
   * changes when the window crosses between the two layouts (a rotated
   * phone, a resized window), and the map then moves the place again.
   */
  protected readonly covered = computed<MapInsets>(() =>
    this.isWide()
      ? { top: 0, right: 0, bottom: 0, left: sidePanelWidthPx + marginPx * 2 }
      : {
          top: marginPx + searchBarHeightPx + gapPx,
          right: 0,
          bottom: this.height() * sheetStops.resting,
          left: 0,
        },
  );

  protected onSearchOpenChange(open: boolean): void {
    if (open) this.search.reset();
    this.searchOpen.set(open);
  }
}
