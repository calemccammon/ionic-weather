import { WeatherError } from '../../../domain/repositories/weather-repository';
import { asheville, ashford, sampleForecast } from '../../../testing/fakes';
import { makeViewModels, type ViewModels } from '../../../testing/view-models';

import { searchDebounceMs } from './search.view-model';

let made: ViewModels;

beforeEach(() => {
  vi.useFakeTimers();
  made = makeViewModels();
  made.weather.forecastToReturn = sampleForecast();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Types `text` and waits out the pause before a search, and the answer if it is ready. */
async function search(text: string): Promise<void> {
  made.search.queryChanged(text);
  await vi.advanceTimersByTimeAsync(searchDebounceMs);
}

const titles = () => {
  const state = made.search.state();
  return state.kind === 'results' ? state.places.map((place) => place.title) : state.kind;
};

it('starts with nothing to show', () => {
  expect(made.search.state()).toEqual({ kind: 'idle' });
});

it('does not search for too little', async () => {
  await search(' a ');

  expect(made.search.state()).toEqual({ kind: 'idle' });
  expect(made.weather.searchQueries).toEqual([]);
});

it('waits for a pause in typing before it searches', async () => {
  made.search.queryChanged('ashev');

  expect(made.search.state()).toEqual({ kind: 'loading', query: 'ashev' });
  await vi.advanceTimersByTimeAsync(searchDebounceMs - 1);
  expect(made.weather.searchQueries).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);

  expect(made.weather.searchQueries).toEqual(['ashev']);
});

it('starts the wait again when typing goes on, so only the last text is searched for', async () => {
  made.search.queryChanged('as');
  await vi.advanceTimersByTimeAsync(300);
  made.search.queryChanged('ashev');
  await vi.advanceTimersByTimeAsync(300);

  expect(made.weather.searchQueries).toEqual([]);

  await vi.advanceTimersByTimeAsync(50);

  expect(made.weather.searchQueries).toEqual(['ashev']);
});

it('shows the places found as rows, and selects the place of the row chosen', async () => {
  made.weather.placesToReturn = [asheville, ashford];

  await search('a place');

  expect(made.search.state()).toMatchObject({ kind: 'results', query: 'a place' });
  expect(titles()).toEqual(['Asheville', 'Ashford']);

  made.search.choose(1);

  expect(made.home.state().place?.title).toBe('Ashford');
});

it('selects nothing for a row that is not there', async () => {
  made.weather.placesToReturn = [asheville];
  await search('ashev');

  made.search.choose(1);
  made.search.choose(-1);

  expect(made.home.state().place).toBeNull();
});

it('says so when nothing is found', async () => {
  made.weather.placesToReturn = [];

  await search('zzzz');

  expect(made.search.state()).toEqual({ kind: 'empty', query: 'zzzz' });
});

it('words a failure for the user, and searches at once on another try', async () => {
  made.weather.failure = new WeatherError('noConnection');

  await search('ashev');

  expect(made.search.state()).toEqual({
    kind: 'failed',
    query: 'ashev',
    message: 'Could not reach the weather service. Check your connection.',
  });

  made.weather.failure = undefined;
  made.weather.placesToReturn = [asheville];
  made.search.retry();

  expect(made.search.state()).toEqual({ kind: 'loading', query: 'ashev' });
  await vi.advanceTimersByTimeAsync(0);
  expect(titles()).toEqual(['Asheville']);
  expect(made.weather.searchQueries).toEqual(['ashev', 'ashev']);
});

it.each([
  ['answer', () => made.weather.searchCalls[0]?.resolve([asheville])],
  ['failure', () => made.weather.searchCalls[0]?.reject(new WeatherError('timeout'))],
])('never shows the %s to an older search over a newer one', async (_, settleFirst) => {
  await search('ashev');
  await search('ashford');
  settleFirst();
  await vi.advanceTimersByTimeAsync(0);

  expect(made.search.state()).toEqual({ kind: 'loading', query: 'ashford' });

  made.weather.searchCalls[1]?.resolve([ashford]);
  await vi.advanceTimersByTimeAsync(0);

  expect(titles()).toEqual(['Ashford']);
  made.search.choose(0);
  expect(made.home.state().place?.title).toBe('Ashford');
});

it('does not search twice for the same text typed again', async () => {
  made.weather.placesToReturn = [asheville];

  await search('ashev');
  await search(' ashev ');

  expect(made.weather.searchQueries).toEqual(['ashev']);
});

it('forgets the text and the results when reset, and drops a search on its way', async () => {
  await search('ashev');

  made.search.reset();
  made.weather.searchCalls[0]?.resolve([asheville]);
  await vi.advanceTimersByTimeAsync(0);

  expect(made.search.state()).toEqual({ kind: 'idle' });
  made.search.choose(0);
  expect(made.home.state().place).toBeNull();

  // The text that was there before can be searched for again.
  made.weather.placesToReturn = [asheville];
  await search('ashev');

  expect(titles()).toEqual(['Asheville']);
});

it('drops a search still waiting for a pause when reset', async () => {
  made.search.queryChanged('ashev');

  made.search.reset();
  await vi.advanceTimersByTimeAsync(searchDebounceMs);

  expect(made.weather.searchQueries).toEqual([]);
});

it('has nothing to try again before anything is typed', async () => {
  made.search.retry();
  await vi.advanceTimersByTimeAsync(0);

  expect(made.search.state()).toEqual({ kind: 'idle' });
  expect(made.weather.searchQueries).toEqual([]);
});
