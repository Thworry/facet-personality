import { describe, expect, it } from 'vitest';
import { getLegacyArchetypeCopy } from '../src/data/archetypes';
import { QUESTIONS } from '../src/data/questions';
import { buildFacetResult } from '../src/domain/result';
import { LOCALE_KEY } from '../src/i18n/locale';
import {
  HISTORY_KEY,
  LEGACY_HISTORY_KEY,
  PROGRESS_KEY,
  appendHistory,
  clearAllLocalData,
  clearProgress,
  loadHistory,
  loadProgress,
  saveProgress,
  type SavedProgress,
  type StoredHistoryV2,
} from '../src/domain/storage';
import type { Answers, FacetResult } from '../src/types';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const questionOrder = QUESTIONS.map((question) => question.id);

function makeProgress(overrides: Partial<SavedProgress> = {}): SavedProgress {
  return {
    version: 1,
    route: 'quiz',
    index: 3,
    order: [...questionOrder],
    answers: { 1: 5, 2: 1, 3: 4 },
    ...overrides,
  };
}

function makeResult(id: string, createdAt: string) {
  const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 3])) as Answers;
  return buildFacetResult(answers, id, createdAt);
}

function makeLegacyRichResult(id: string, createdAt: string) {
  const result = makeResult(id, createdAt);
  return {
    ...result,
    primary: {
      ...getLegacyArchetypeCopy(result.primary.code),
      distance: result.primary.distance,
    },
    adjacent: {
      ...getLegacyArchetypeCopy(result.adjacent.code),
      distance: result.adjacent.distance,
    },
    standout: {
      ...result.standout,
      label: '旧版突出切面文案',
    },
  };
}

function storedHistory(results: FacetResult[]): StoredHistoryV2 {
  return { version: 2, results };
}

describe('progress storage', () => {
  it('round-trips a valid versioned progress record', () => {
    const storage = new MemoryStorage();
    const progress = makeProgress();

    expect(saveProgress(progress, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('returns null for malformed JSON or a mismatched schema version', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, '{not-json');
    expect(loadProgress(storage)).toBeNull();

    storage.setItem(PROGRESS_KEY, JSON.stringify({ ...makeProgress(), version: 2 }));
    expect(loadProgress(storage)).toBeNull();
  });

  it('rejects an invalid index, order, route, or answer value', () => {
    const storage = new MemoryStorage();
    const invalidRecords = [
      makeProgress({ index: 32 }),
      makeProgress({ order: questionOrder.slice(0, 31) }),
      makeProgress({ order: [...questionOrder.slice(0, 31), 31] }),
      { ...makeProgress(), route: 'result' },
      makeProgress({ answers: { 1: 0 as 1 } }),
      makeProgress({ answers: { 33: 4 } }),
    ];

    for (const record of invalidRecords) {
      storage.setItem(PROGRESS_KEY, JSON.stringify(record));
      expect(loadProgress(storage)).toBeNull();
    }
  });

  it('contains quota or unavailable-storage errors', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    expect(() => saveProgress(makeProgress(), storage)).not.toThrow();
    expect(saveProgress(makeProgress(), storage)).toBe(false);
  });

  it('clears only the progress key when requested', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify(makeProgress()));
    storage.setItem(HISTORY_KEY, '[]');

    expect(clearProgress(storage)).toBe(true);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(HISTORY_KEY)).toBe('[]');
  });
});

describe('result history storage', () => {
  it('uses separate legacy and locale-neutral history keys', () => {
    expect(LEGACY_HISTORY_KEY).toBe('facet:v1:history');
    expect(HISTORY_KEY).toBe('facet:v2:history');
  });

  it('keeps the three newest distinct results in newest-first order', () => {
    const storage = new MemoryStorage();
    const results = [
      makeResult('one', '2026-08-01T00:00:00.000Z'),
      makeResult('two', '2026-08-02T00:00:00.000Z'),
      makeResult('three', '2026-08-03T00:00:00.000Z'),
      makeResult('four', '2026-08-04T00:00:00.000Z'),
    ];

    for (const result of results) {
      expect(appendHistory(result, storage)).toBe(true);
    }

    expect(loadHistory(storage).map((result) => result.id)).toEqual(['four', 'three', 'two']);
  });

  it('replaces a repeated result id instead of duplicating it', () => {
    const storage = new MemoryStorage();
    const first = makeResult('same', '2026-08-01T00:00:00.000Z');
    const revised = makeResult('same', '2026-08-09T00:00:00.000Z');

    appendHistory(first, storage);
    appendHistory(revised, storage);

    expect(loadHistory(storage)).toHaveLength(1);
    expect(loadHistory(storage)[0]?.createdAt).toBe('2026-08-09T00:00:00.000Z');
  });

  it('persists only stable archetype and standout references', () => {
    const storage = new MemoryStorage();

    expect(appendHistory(makeResult('neutral', '2026-08-24T00:00:00.000Z'), storage)).toBe(true);

    const [saved] = loadHistory(storage);
    expect(saved?.primary).toEqual({ code: expect.any(String), distance: expect.any(Number) });
    expect(saved?.adjacent).toEqual({ code: expect.any(String), distance: expect.any(Number) });
    expect(saved?.standout).not.toHaveProperty('label');
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toEqual({
      version: 2,
      results: [saved],
    });
  });

  it.each([
    ['rich v1', makeLegacyRichResult('legacy-rich', '2026-08-01T00:00:00.000Z')],
    ['transitional neutral v1', makeResult('legacy-neutral', '2026-08-02T00:00:00.000Z')],
  ])('migrates %s records once into the same neutral v2 contract', (_label, legacy) => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([legacy]));

    const firstLoad = loadHistory(storage);
    const migrated = JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null') as StoredHistoryV2;
    const firstEnvelope = storage.getItem(HISTORY_KEY);
    const secondLoad = loadHistory(storage);

    expect(firstLoad).toEqual(secondLoad);
    expect(firstLoad.map((result) => result.id)).toEqual([legacy.id]);
    expect(migrated).toEqual(storedHistory(firstLoad));
    expect(migrated.results[0]?.primary).toEqual({
      code: legacy.primary.code,
      distance: legacy.primary.distance,
    });
    expect(migrated.results[0]?.adjacent).toEqual({
      code: legacy.adjacent.code,
      distance: legacy.adjacent.distance,
    });
    expect(migrated.results[0]?.primary).not.toHaveProperty('name');
    expect(migrated.results[0]?.standout).not.toHaveProperty('label');
    expect(storage.getItem(HISTORY_KEY)).toBe(firstEnvelope);
    expect(storage.getItem(LEGACY_HISTORY_KEY)).not.toBeNull();
  });

  it('deduplicates migrated v1 records first-newest and limits them to three', () => {
    const storage = new MemoryStorage();
    const firstNewest = makeLegacyRichResult('same', '2026-08-05T00:00:00.000Z');
    const duplicateOlder = makeResult('same', '2026-08-01T00:00:00.000Z');
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([
      firstNewest,
      makeResult('two', '2026-08-04T00:00:00.000Z'),
      duplicateOlder,
      makeResult('three', '2026-08-03T00:00:00.000Z'),
      makeResult('four', '2026-08-02T00:00:00.000Z'),
    ]));

    const history = loadHistory(storage);

    expect(history.map((result) => result.id)).toEqual(['same', 'two', 'three']);
    expect(history[0]?.createdAt).toBe(firstNewest.createdAt);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toEqual(storedHistory(history));
  });

  it('ignores malformed, unknown-code, and invalid-score records during v1 migration', () => {
    const storage = new MemoryStorage();
    const valid = makeLegacyRichResult('valid', '2026-08-04T00:00:00.000Z');
    const unknownBase = makeLegacyRichResult('unknown', '2026-08-03T00:00:00.000Z');
    const unknownCode = {
      ...unknownBase,
      primary: { ...unknownBase.primary, code: 'UNKNOWN' },
    };
    const invalidScoreBase = makeResult('invalid-score', '2026-08-02T00:00:00.000Z');
    const invalidScore = {
      ...invalidScoreBase,
      coreScores: { ...invalidScoreBase.coreScores, F1: 101 },
    };
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([
      { id: 'broken' },
      unknownCode,
      valid,
      invalidScore,
    ]));

    expect(loadHistory(storage).map((result) => result.id)).toEqual(['valid']);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toMatchObject({
      version: 2,
      results: [{ id: 'valid' }],
    });
  });

  it('contains malformed legacy JSON and records an empty completed migration', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_HISTORY_KEY, '{not-json');

    expect(() => loadHistory(storage)).not.toThrow();
    expect(loadHistory(storage)).toEqual([]);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toEqual(storedHistory([]));
  });

  it('returns normalized migrated records when v2 writing fails and retries later', () => {
    const storage = new MemoryStorage();
    const legacy = makeLegacyRichResult('retry', '2026-08-01T00:00:00.000Z');
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([legacy]));
    let writesRemainingToFail = 1;
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      if (key === HISTORY_KEY && writesRemainingToFail > 0) {
        writesRemainingToFail -= 1;
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      setItem(key, value);
    };

    expect(loadHistory(storage).map((result) => result.id)).toEqual(['retry']);
    expect(storage.getItem(HISTORY_KEY)).toBeNull();

    expect(loadHistory(storage).map((result) => result.id)).toEqual(['retry']);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toMatchObject({
      version: 2,
      results: [{ id: 'retry' }],
    });
  });

  it.each([
    ['rich v1', makeLegacyRichResult('legacy-rich', '2026-08-01T00:00:00.000Z')],
    ['transitional neutral v1', makeResult('legacy-neutral', '2026-08-02T00:00:00.000Z')],
  ])('preserves %s records on the first append while writing only v2', (_label, legacy) => {
    const storage = new MemoryStorage();
    const newcomer = makeResult('new', '2026-08-03T00:00:00.000Z');
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([legacy]));
    const legacyBeforeAppend = storage.getItem(LEGACY_HISTORY_KEY);

    expect(appendHistory(newcomer, storage)).toBe(true);

    expect(loadHistory(storage).map((result) => result.id)).toEqual(['new', legacy.id]);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toEqual(
      storedHistory(loadHistory(storage)),
    );
    expect(storage.getItem(LEGACY_HISTORY_KEY)).toBe(legacyBeforeAppend);
  });

  it('treats an existing malformed v2 key as authoritative and never falls back to v1', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([
      makeLegacyRichResult('legacy', '2026-08-01T00:00:00.000Z'),
    ]));
    storage.setItem(HISTORY_KEY, '{not-json');

    expect(loadHistory(storage)).toEqual([]);
    expect(storage.getItem(HISTORY_KEY)).toBe('{not-json');
  });

  it('strictly rejects malformed, rich, unknown-code, or out-of-range v2 results', () => {
    const storage = new MemoryStorage();
    const valid = makeResult('valid', '2026-08-01T00:00:00.000Z');
    const invalidPayloads = [
      null,
      [],
      { version: 1, results: [valid] },
      { version: 2, results: [{ id: 'broken' }] },
      storedHistory([makeLegacyRichResult('rich', '2026-08-01T00:00:00.000Z') as unknown as FacetResult]),
      storedHistory([{
        ...valid,
        primary: { ...valid.primary, code: 'UNKNOWN' },
      } as unknown as FacetResult]),
      storedHistory([{
        ...valid,
        coreScores: { ...valid.coreScores, F1: 101 },
      }]),
      storedHistory([{
        ...valid,
        stateScores: { ...valid.stateScores, W2: -1 },
      }]),
      storedHistory([{
        ...valid,
        primary: { ...valid.primary, distance: Number.POSITIVE_INFINITY },
      }]),
    ];

    for (const payload of invalidPayloads) {
      storage.setItem(HISTORY_KEY, JSON.stringify(payload));
      expect(loadHistory(storage)).toEqual([]);
    }
  });

  it('normalizes a valid v2 envelope to the first three distinct IDs', () => {
    const storage = new MemoryStorage();
    const newest = makeResult('same', '2026-08-05T00:00:00.000Z');
    storage.setItem(HISTORY_KEY, JSON.stringify(storedHistory([
      newest,
      makeResult('two', '2026-08-04T00:00:00.000Z'),
      makeResult('same', '2026-08-01T00:00:00.000Z'),
      makeResult('three', '2026-08-03T00:00:00.000Z'),
      makeResult('four', '2026-08-02T00:00:00.000Z'),
    ])));

    const history = loadHistory(storage);

    expect(history.map((result) => result.id)).toEqual(['same', 'two', 'three']);
    expect(history[0]).toEqual(newest);
  });

  it('rejects invalid new results without changing a valid v2 envelope', () => {
    const storage = new MemoryStorage();
    const saved = makeResult('saved', '2026-08-01T00:00:00.000Z');
    const envelope = storedHistory([saved]);
    storage.setItem(HISTORY_KEY, JSON.stringify(envelope));

    expect(appendHistory({
      ...makeResult('invalid', '2026-08-02T00:00:00.000Z'),
      adjacent: { code: 'UNKNOWN', distance: 1 },
    } as unknown as FacetResult, storage)).toBe(false);
    expect(JSON.parse(storage.getItem(HISTORY_KEY) ?? 'null')).toEqual(envelope);
  });

  it('deletes all four FACET keys without clearing unrelated local data', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify(makeProgress()));
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([
      makeLegacyRichResult('legacy', '2026-08-01T00:00:00.000Z'),
    ]));
    storage.setItem(HISTORY_KEY, JSON.stringify(storedHistory([
      makeResult('saved', '2026-08-02T00:00:00.000Z'),
    ])));
    storage.setItem(LOCALE_KEY, 'en');
    storage.setItem('another-app', 'keep me');

    expect(clearAllLocalData(storage)).toBe(true);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_HISTORY_KEY)).toBeNull();
    expect(storage.getItem(HISTORY_KEY)).toBeNull();
    expect(storage.getItem(LOCALE_KEY)).toBeNull();
    expect(storage.getItem('another-app')).toBe('keep me');

    expect(loadHistory(storage)).toEqual([]);
    expect(storage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('attempts every scoped removal and returns false when one removal fails', () => {
    const storage = new MemoryStorage();
    const attempted: string[] = [];
    const removeItem = storage.removeItem.bind(storage);
    storage.removeItem = (key) => {
      attempted.push(key);
      if (key === LEGACY_HISTORY_KEY) {
        throw new DOMException('Blocked', 'SecurityError');
      }
      removeItem(key);
    };

    expect(clearAllLocalData(storage)).toBe(false);
    expect(attempted).toEqual([PROGRESS_KEY, LEGACY_HISTORY_KEY, HISTORY_KEY, LOCALE_KEY]);
  });
});
