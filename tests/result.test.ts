import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/data/questions';
import {
  buildFacetResult,
  classifyClarity,
  classifyWeather,
  selectStandout,
} from '../src/domain/result';
import type { Answers, CoreScores } from '../src/types';

describe('result classification', () => {
  it('applies clarity and free-facet thresholds at exact boundaries', () => {
    expect(classifyClarity(0.2, 0.23)).toBe('dual');
    expect(classifyClarity(0.2, 0.235)).toBe('leaning');
    expect(classifyClarity(0.2, 0.28)).toBe('leaning');
    expect(classifyClarity(0.2, 0.281)).toBe('clear');
    expect(classifyClarity(0.42, 0.7)).toBe('clear');
    expect(classifyClarity(0.421, 0.6)).toBe('free');
  });

  it('classifies all four recent-weather quadrants', () => {
    expect(classifyWeather({ W1: 49, W2: 50 }).code).toBe('CLEAR');
    expect(classifyWeather({ W1: 49, W2: 49 }).code).toBe('MIST');
    expect(classifyWeather({ W1: 50, W2: 50 }).code).toBe('TURBO');
    expect(classifyWeather({ W1: 50, W2: 49 }).code).toBe('STORM');
  });

  it('marks either state score within five points of 50 as a weather boundary', () => {
    expect(classifyWeather({ W1: 45, W2: 80 }).isBoundary).toBe(true);
    expect(classifyWeather({ W1: 80, W2: 55 }).isBoundary).toBe(true);
    expect(classifyWeather({ W1: 44, W2: 56 }).isBoundary).toBe(false);
  });

  it('selects the farthest qualifying standout with stable axis order on ties', () => {
    const high: CoreScores = { F1: 72, F2: 50, F3: 20, F4: 50, F5: 50, F6: 50 };
    expect(selectStandout(high)).toMatchObject({ dimension: 'F3', direction: 'low' });

    const tied: CoreScores = { F1: 25, F2: 75, F3: 50, F4: 50, F5: 50, F6: 50 };
    expect(selectStandout(tied)).toMatchObject({ dimension: 'F1', direction: 'low' });
  });

  it('returns balanced copy when no core score reaches a standout threshold', () => {
    const scores: CoreScores = { F1: 29, F2: 71, F3: 50, F4: 50, F5: 50, F6: 50 };
    expect(selectStandout(scores)).toMatchObject({
      dimension: 'BALANCED',
      direction: 'balanced',
    });
  });
});

describe('facet result assembly', () => {
  it('assembles a deterministic, frozen result with injected identity', () => {
    const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 3])) as Answers;
    const result = buildFacetResult(answers, 'fixed-result', '2026-08-24T00:00:00.000Z');

    expect(result.id).toBe('fixed-result');
    expect(result.createdAt).toBe('2026-08-24T00:00:00.000Z');
    expect(result.coreScores).toEqual({ F1: 50, F2: 50, F3: 50, F4: 50, F5: 50, F6: 50 });
    expect(result.stateScores).toEqual({ W1: 50, W2: 50 });
    expect(result.primary).toEqual({ code: expect.any(String), distance: expect.any(Number) });
    expect(result.adjacent).toEqual({ code: expect.any(String), distance: expect.any(Number) });
    expect(result.primary.code).not.toBe(result.adjacent.code);
    expect(result.weather).toEqual({ code: 'TURBO', isBoundary: true });
    expect(result.standout).not.toHaveProperty('label');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.coreScores)).toBe(true);
  });
});
