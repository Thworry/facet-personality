import { describe, expect, it } from 'vitest';
import { ARCHETYPES } from '../src/data/archetypes';
import { QUESTIONS } from '../src/data/questions';
import {
  keyedValue,
  normalizedDistance,
  patternToCentroid,
  rankArchetypes,
  scoreDimension,
  scoreDimensions,
} from '../src/domain/scoring';
import type { Answers, CoreScores } from '../src/types';

const neutralAnswers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 3])) as Answers;

describe('dimension scoring', () => {
  it('keys forward and reverse values in the same high-score direction', () => {
    expect(keyedValue(5, 'forward')).toBe(5);
    expect(keyedValue(1, 'reverse')).toBe(5);
    expect(keyedValue(5, 'reverse')).toBe(1);
  });

  it('reverse-scores and normalizes four responses to 0–100', () => {
    const questions = [
      { id: 1, dimension: 'F1', direction: 'forward' },
      { id: 2, dimension: 'F1', direction: 'reverse' },
      { id: 3, dimension: 'F1', direction: 'forward' },
      { id: 4, dimension: 'F1', direction: 'reverse' },
    ] as const;
    const answers = { 1: 5, 2: 1, 3: 5, 4: 1 } as const;

    expect(scoreDimension(questions, answers)).toBe(100);
  });

  it('returns 50 for four neutral responses', () => {
    const f1Questions = QUESTIONS.filter((question) => question.dimension === 'F1');
    expect(scoreDimension(f1Questions, { 1: 3, 2: 3, 3: 3, 4: 3 })).toBe(50);
  });

  it('returns all eight continuous scores for a complete answer set', () => {
    expect(scoreDimensions(neutralAnswers)).toEqual({
      F1: 50,
      F2: 50,
      F3: 50,
      F4: 50,
      F5: 50,
      F6: 50,
      W1: 50,
      W2: 50,
    });
  });

  it('reports the first missing answer instead of emitting a partial score', () => {
    const incomplete = { ...neutralAnswers };
    delete incomplete[17];
    expect(() => scoreDimensions(incomplete)).toThrow('Missing answer for question 17');
  });
});

describe('archetype distance', () => {
  it('converts L, M, and H levels into transparent centroids', () => {
    expect(patternToCentroid(['L', 'M', 'H', 'L', 'M', 'H'])).toEqual([0.25, 0.5, 0.75, 0.25, 0.5, 0.75]);
  });

  it('gives an exact centroid zero distance and ranks it first', () => {
    const target = ARCHETYPES.find((archetype) => archetype.code === 'SCOUT')!;
    const centroid = patternToCentroid(target.pattern);
    const scores: CoreScores = {
      F1: centroid[0]! * 100,
      F2: centroid[1]! * 100,
      F3: centroid[2]! * 100,
      F4: centroid[3]! * 100,
      F5: centroid[4]! * 100,
      F6: centroid[5]! * 100,
    };

    expect(normalizedDistance(scores, target.pattern)).toBe(0);
    expect(rankArchetypes(scores)[0]?.code).toBe('SCOUT');
  });

  it('sorts equal distances by code without mutating product data', () => {
    const originalOrder = ARCHETYPES.map((archetype) => archetype.code);
    const scores: CoreScores = { F1: 50, F2: 50, F3: 50, F4: 50, F5: 50, F6: 50 };
    const ranked = rankArchetypes(scores);

    for (let index = 1; index < ranked.length; index += 1) {
      const previous = ranked[index - 1]!;
      const current = ranked[index]!;
      expect(previous.distance).toBeLessThanOrEqual(current.distance);
      if (Math.abs(previous.distance - current.distance) < Number.EPSILON) {
        expect(previous.code.localeCompare(current.code)).toBeLessThan(0);
      }
    }
    expect(ARCHETYPES.map((archetype) => archetype.code)).toEqual(originalOrder);
  });
});
