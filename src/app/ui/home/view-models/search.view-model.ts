import { DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';

import type { Place } from '../../../domain/models/place';
import { isSearchable, SearchPlaces } from '../../../domain/use-cases/search-places';
import { messageForError } from '../../core/failure-messages';
import { placeUiModelFrom } from '../models/place-ui-model';
import type { SearchState } from '../models/search-state';

import { HomeViewModel } from './home.view-model';

/** How long typing must pause before a search is sent. */
export const searchDebounceMs = 350;

/**
 * Turns what the user types into search results.
 *
 * It waits for a pause in typing before searching, and an answer that comes
 * back after a newer search has been sent is thrown away.
 */
@Injectable()
export class SearchViewModel {
  private readonly searchPlaces = inject(SearchPlaces);
  private readonly home = inject(HomeViewModel);

  private debounce: ReturnType<typeof setTimeout> | undefined;

  /** The text last asked about; what `retry` asks about again. */
  private latestQuery = '';

  /**
   * Counts changes of the query, so an answer can tell whether it is still
   * wanted. The text alone cannot: the same text can be searched for twice.
   */
  private request = 0;

  /** The places behind the rows of the current results, in order. */
  private results: readonly Place[] = [];

  private readonly current = signal<SearchState>({ kind: 'idle' });

  /** What the search results area shows. */
  readonly state: Signal<SearchState> = this.current.asReadonly();

  constructor() {
    // Stops waiting on a pause in typing when the view model is done with.
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.debounce);
      this.request++;
    });
  }

  queryChanged(text: string): void {
    const query = text.trim();
    if (query === this.latestQuery) return;
    this.latestQuery = query;
    this.request++;
    clearTimeout(this.debounce);

    if (!isSearchable(query)) {
      this.current.set({ kind: 'idle' });
      return;
    }
    this.current.set({ kind: 'loading', query });
    this.debounce = setTimeout(() => void this.search(query), searchDebounceMs);
  }

  /** Forgets the current query and results, as when the search bar opens. */
  reset(): void {
    clearTimeout(this.debounce);
    this.latestQuery = '';
    this.request++;
    this.results = [];
    this.current.set({ kind: 'idle' });
  }

  /** Makes the result in row `index` the selected place. */
  choose(index: number): void {
    const place = this.results[index];
    if (this.current().kind !== 'results' || place === undefined) return;
    this.home.select(place);
  }

  /** Runs the last search again after a failure. */
  retry(): void {
    const query = this.latestQuery;
    if (!isSearchable(query)) return;
    clearTimeout(this.debounce);
    this.request++;
    this.current.set({ kind: 'loading', query });
    void this.search(query);
  }

  private async search(query: string): Promise<void> {
    const request = this.request;
    let places: Place[] = [];
    let state: SearchState;
    try {
      places = await this.searchPlaces.execute(query);
      state =
        places.length === 0
          ? { kind: 'empty', query }
          : { kind: 'results', query, places: places.map(placeUiModelFrom) };
    } catch (error) {
      state = { kind: 'failed', query, message: messageForError(error) };
    }
    if (request !== this.request) return;
    this.results = places;
    this.current.set(state);
  }
}
