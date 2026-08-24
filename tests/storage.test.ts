import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/data/questions';
import { buildFacetResult } from '../src/domain/result';
import {
  HISTORY_KEY,
  PROGRESS_KEY,
  appendHistory,
  clearAllLocalData,
  clearProgress,
  loadHistory,
  loadProgress,
  saveProgress,
  type SavedProgress,
} from '../src/domain/storage';
import type { Answers } from '../src/types';

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
  });

  it('returns an empty history for malformed or invalid payloads', () => {
    const storage = new MemoryStorage();
    storage.setItem(HISTORY_KEY, '{not-json');
    expect(loadHistory(storage)).toEqual([]);

    storage.setItem(HISTORY_KEY, JSON.stringify([{ id: 'broken' }]));
    expect(loadHistory(storage)).toEqual([]);
  });

  it('deletes both FACET keys without clearing unrelated local data', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify(makeProgress()));
    storage.setItem(HISTORY_KEY, JSON.stringify([makeResult('saved', '2026-08-01T00:00:00.000Z')]));
    storage.setItem('another-app', 'keep me');

    expect(clearAllLocalData(storage)).toBe(true);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(HISTORY_KEY)).toBeNull();
    expect(storage.getItem('another-app')).toBe('keep me');
  });
});
