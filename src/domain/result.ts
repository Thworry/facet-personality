import { BALANCED_STANDOUT, CORE_DIMENSIONS, DIMENSION_COPY } from '../data/copy';
import { rankArchetypes, scoreDimensions } from './scoring';
import type {
  Answers,
  Clarity,
  CoreScores,
  FacetResult,
  StandoutResult,
  StateScores,
  WeatherResult,
} from '../types';

const FLOAT_TOLERANCE = 1e-12;

export function classifyClarity(firstDistance: number, secondDistance: number): Clarity {
  if (firstDistance > 0.42) {
    return 'free';
  }

  const gap = secondDistance - firstDistance;
  if (gap + FLOAT_TOLERANCE < 0.035) {
    return 'dual';
  }
  if (gap <= 0.08 + FLOAT_TOLERANCE) {
    return 'leaning';
  }
  return 'clear';
}

export function classifyWeather(scores: StateScores): WeatherResult {
  let code: WeatherResult['code'];
  if (scores.W1 < 50) {
    code = scores.W2 >= 50 ? 'CLEAR' : 'MIST';
  } else {
    code = scores.W2 >= 50 ? 'TURBO' : 'STORM';
  }

  return Object.freeze({
    code,
    isBoundary: Math.abs(scores.W1 - 50) <= 5 || Math.abs(scores.W2 - 50) <= 5,
  });
}

export function selectStandout(scores: CoreScores): StandoutResult {
  const farthest = CORE_DIMENSIONS.reduce((selected, dimension) => {
    const distance = Math.abs(scores[dimension] - 50);
    const selectedDistance = Math.abs(scores[selected] - 50);
    return distance > selectedDistance ? dimension : selected;
  }, CORE_DIMENSIONS[0]);
  const score = scores[farthest];

  if (score <= 28) {
    return Object.freeze({
      dimension: farthest,
      direction: 'low',
      label: DIMENSION_COPY[farthest].lowLabel,
    });
  }
  if (score >= 72) {
    return Object.freeze({
      dimension: farthest,
      direction: 'high',
      label: DIMENSION_COPY[farthest].highLabel,
    });
  }
  return Object.freeze({ ...BALANCED_STANDOUT });
}

export function buildFacetResult(
  answers: Answers,
  id: string = crypto.randomUUID(),
  createdAt: string = new Date().toISOString(),
): FacetResult {
  const dimensions = scoreDimensions(answers);
  const coreScores = Object.freeze({
    F1: dimensions.F1,
    F2: dimensions.F2,
    F3: dimensions.F3,
    F4: dimensions.F4,
    F5: dimensions.F5,
    F6: dimensions.F6,
  });
  const stateScores = Object.freeze({ W1: dimensions.W1, W2: dimensions.W2 });
  const [primary, adjacent] = rankArchetypes(coreScores);

  if (primary === undefined || adjacent === undefined) {
    throw new Error('At least two archetypes are required to build a FACET result');
  }

  return Object.freeze({
    id,
    createdAt,
    coreScores,
    stateScores,
    primary,
    adjacent,
    clarity: classifyClarity(primary.distance, adjacent.distance),
    weather: classifyWeather(stateScores),
    standout: selectStandout(coreScores),
  });
}
