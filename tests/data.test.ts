import { describe, expect, it } from 'vitest';
import { ARCHETYPES } from '../src/data/archetypes';
import { QUESTIONS } from '../src/data/questions';
import type { Level } from '../src/types';

const levelDistance: Record<Level, number> = { L: 0, M: 1, H: 2 };

describe('product data', () => {
  it('contains exactly 32 unique questions', () => {
    expect(QUESTIONS).toHaveLength(32);
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(32);
    expect(new Set(QUESTIONS.map((question) => question.prompt)).size).toBe(32);
  });

  it('balances every dimension with two forward and two reverse items', () => {
    for (const dimension of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'W1', 'W2']) {
      const items = QUESTIONS.filter((question) => question.dimension === dimension);
      expect(items).toHaveLength(4);
      expect(items.filter((question) => question.direction === 'forward')).toHaveLength(2);
      expect(items.filter((question) => question.direction === 'reverse')).toHaveLength(2);
    }
  });

  it('uses the usual timeframe for core items and two-weeks for state items', () => {
    expect(QUESTIONS.slice(0, 24).every((question) => question.timeframe === 'usual')).toBe(true);
    expect(QUESTIONS.slice(24).every((question) => question.timeframe === 'two-weeks')).toBe(true);
  });

  it('contains 12 unique six-axis archetypes with complete copy', () => {
    expect(ARCHETYPES).toHaveLength(12);
    expect(new Set(ARCHETYPES.map((type) => type.code)).size).toBe(12);
    expect(new Set(ARCHETYPES.map((type) => type.pattern.join(''))).size).toBe(12);
    for (const archetype of ARCHETYPES) {
      expect(archetype.strengths).toHaveLength(3);
      expect(archetype.pitfalls).toHaveLength(3);
      expect(archetype.relationshipNeed.length).toBeGreaterThan(0);
      expect(archetype.action.length).toBeGreaterThan(0);
    }
  });

  it('balances L, M, and H four times on every axis', () => {
    for (let axis = 0; axis < 6; axis += 1) {
      const values = ARCHETYPES.map((type) => type.pattern[axis]);
      expect(values.filter((level) => level === 'L')).toHaveLength(4);
      expect(values.filter((level) => level === 'M')).toHaveLength(4);
      expect(values.filter((level) => level === 'H')).toHaveLength(4);
    }
  });

  it('keeps every archetype pair at Manhattan distance four or greater', () => {
    for (let left = 0; left < ARCHETYPES.length; left += 1) {
      for (let right = left + 1; right < ARCHETYPES.length; right += 1) {
        const first = ARCHETYPES[left]!;
        const second = ARCHETYPES[right]!;
        const distance = first.pattern.reduce(
          (sum, level, axis) => sum + Math.abs(levelDistance[level] - levelDistance[second.pattern[axis]!]),
          0,
        );
        expect(distance, `${first.code}/${second.code}`).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
