import { StoredSettingsRepository, type KeyValueStore } from './stored-settings-repository';

/** A store held in memory, which can be made to fail. */
class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>();
  broken = false;

  async getItem(key: string): Promise<string | null> {
    if (this.broken) throw new Error('The store cannot be read.');
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.broken) throw new Error('The store is full.');
    this.values.set(key, value);
  }
}

let store: MemoryStore;

beforeEach(() => {
  store = new MemoryStore();
});

it('has no units until some are chosen', async () => {
  expect((await StoredSettingsRepository.open(store)).units).toBeNull();
});

it('answers with the chosen units at once, and has them for the next launch', async () => {
  const settings = await StoredSettingsRepository.open(store);

  await settings.saveUnits('imperial');

  expect(settings.units).toBe('imperial');
  expect((await StoredSettingsRepository.open(store)).units).toBe('imperial');
});

it('counts a stored word this version does not know as no choice', async () => {
  store.values.set('units', 'kelvin');

  expect((await StoredSettingsRepository.open(store)).units).toBeNull();
});

it('starts with no choice when the store cannot be read', async () => {
  store.values.set('units', 'imperial');
  store.broken = true;

  expect((await StoredSettingsRepository.open(store)).units).toBeNull();
});

it('reports a choice that could not be kept, and still uses it for now', async () => {
  const settings = await StoredSettingsRepository.open(store);
  store.broken = true;

  await expect(settings.saveUnits('metric')).rejects.toThrow('The store is full.');
  expect(settings.units).toBe('metric');
});
