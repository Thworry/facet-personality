import { ARCHETYPES } from '../data/archetypes';
import { CORE_DIMENSIONS, DIMENSIONS } from '../data/copy';
import { QUESTIONS } from '../data/questions';
import type {
  Answers,
  Archetype,
  CoreScores,
  Direction,
  Level,
  Question,
  RankedArchetype,
  StateScores,
} from '../types';

const LEVEL_VALUE: Readonly<Record<Level, number>> = Object.freeze({
  L: 0.25,
  M: 0.5,
  H: 0.75,
});

export function keyedValue(value: 1 | 2 | 3 | 4 | 5, direction: Direction): number {
  return direction === 'forward' ? value : 6 - value;
}

export function scoreDimension(
  questions: readonly Pick<Question, 'id' | 'direction'>[],
  answers: Answers,
): number {
  if (questions.length === 0) {
    throw new Error('Cannot score a dimension without questions');
  }

  const values = questions.map((question) => {
    const answer = answers[question.id];
    if (answer === undefined) {
      throw new Error(`Missing answer for question ${question.id}`);
    }
    return keyedValue(answer, question.direction);
  });
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(((mean - 1) / 4) * 100);
}

export interface DimensionScores {
  core: CoreScores;
  state: StateScores;
  all: CoreScores & StateScores;
}

export function scoreDimensions(answers: Answers): CoreScores & StateScores {
  for (const question of QUESTIONS) {
    if (answers[question.id] === undefined) {
      throw new Error(`Missing answer for question ${question.id}`);
    }
  }

  const entries = DIMENSIONS.map((dimension) => {
    const items = QUESTIONS.filter((question) => question.dimension === dimension);
    return [dimension, scoreDimension(items, answers)] as const;
  });

  return Object.freeze(Object.fromEntries(entries)) as CoreScores & StateScores;
}

export function patternToCentroid(pattern: Archetype['pattern']): readonly [number, number, number, number, number, number] {
  return [
    LEVEL_VALUE[pattern[0]],
    LEVEL_VALUE[pattern[1]],
    LEVEL_VALUE[pattern[2]],
    LEVEL_VALUE[pattern[3]],
    LEVEL_VALUE[pattern[4]],
    LEVEL_VALUE[pattern[5]],
  ];
}

export function normalizedDistance(scores: CoreScores, pattern: Archetype['pattern']): number {
  const values = CORE_DIMENSIONS.map((code) => scores[code] / 100);
  const centroid = patternToCentroid(pattern);
  const mse = values.reduce(
    (sum, value, index) => sum + (value - centroid[index]!) ** 2,
    0,
  ) / CORE_DIMENSIONS.length;
  return Math.sqrt(mse);
}

function cloneRanked(archetype: Archetype, distance: number): RankedArchetype {
  const pattern = Object.freeze([...archetype.pattern]) as unknown as Archetype['pattern'];
  const strengths = Object.freeze([...archetype.strengths]) as unknown as Archetype['strengths'];
  const pitfalls = Object.freeze([...archetype.pitfalls]) as unknown as Archetype['pitfalls'];

  return Object.freeze({
    ...archetype,
    pattern,
    strengths,
    pitfalls,
    distance,
  });
}

export function rankArchetypes(
  scores: CoreScores,
  archetypes: readonly Archetype[] = ARCHETYPES,
): RankedArchetype[] {
  return archetypes
    .map((archetype) => cloneRanked(archetype, normalizedDistance(scores, archetype.pattern)))
    .sort((left, right) => left.distance - right.distance || left.code.localeCompare(right.code));
}
