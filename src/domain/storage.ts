import { ARCHETYPE_DEFINITIONS } from '../data/archetypes';
import { LOCALE_KEY } from '../i18n/locale';
import type {
  Answers,
  ArchetypeCode,
  Clarity,
  CoreScores,
  FacetResult,
  RankedArchetypeResult,
  StandoutResult,
  StateScores,
  WeatherResult,
} from '../types';

export const PROGRESS_KEY = 'facet:v1:progress';
export const LEGACY_HISTORY_KEY = 'facet:v1:history';
export const HISTORY_KEY = 'facet:v2:history';

export interface SavedProgress {
  version: 1;
  route: 'intro' | 'quiz';
  index: number;
  order: number[];
  answers: Answers;
}

export interface StoredHistoryV2 {
  version: 2;
  results: FacetResult[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isQuestionOrder(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.length === 32
    && value.every((id) => Number.isInteger(id) && id >= 1 && id <= 32)
    && new Set(value).size === 32;
}

function isAnswers(value: unknown): value is Answers {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, answer]) => {
    const questionId = Number(key);
    return Number.isInteger(questionId)
      && questionId >= 1
      && questionId <= 32
      && String(questionId) === key
      && Number.isInteger(answer)
      && isNumberInRange(answer, 1, 5);
  });
}

function isSavedProgress(value: unknown): value is SavedProgress {
  return isRecord(value)
    && value.version === 1
    && (value.route === 'intro' || value.route === 'quiz')
    && Number.isInteger(value.index)
    && isNumberInRange(value.index, 0, 31)
    && isQuestionOrder(value.order)
    && isAnswers(value.answers);
}

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadProgress(storage: Storage = localStorage): SavedProgress | null {
  const parsed = readJson(storage, PROGRESS_KEY);
  return isSavedProgress(parsed) ? parsed : null;
}

export function saveProgress(progress: SavedProgress, storage: Storage = localStorage): boolean {
  if (!isSavedProgress(progress)) {
    return false;
  }
  return writeJson(storage, PROGRESS_KEY, progress);
}

export function clearProgress(storage: Storage = localStorage): boolean {
  try {
    storage.removeItem(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}

const CLARITIES = new Set<Clarity>(['dual', 'leaning', 'clear', 'free']);
const WEATHER_CODES = new Set<WeatherResult['code']>(['CLEAR', 'MIST', 'TURBO', 'STORM']);
const CORE_CODES = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'] as const;
const STATE_CODES = ['W1', 'W2'] as const;
const LEVELS = new Set(['L', 'M', 'H']);
const ARCHETYPE_CODES = new Set<ArchetypeCode>(
  ARCHETYPE_DEFINITIONS.map((archetype) => archetype.code),
);
const ARCHETYPE_PATTERNS = new Map(
  ARCHETYPE_DEFINITIONS.map((archetype) => [archetype.code, archetype.pattern] as const),
);

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function isRankedArchetypeResult(value: unknown): value is RankedArchetypeResult {
  return isRecord(value)
    && hasOnlyKeys(value, ['code', 'distance'])
    && typeof value.code === 'string'
    && ARCHETYPE_CODES.has(value.code as ArchetypeCode)
    && isNumberInRange(value.distance, 0, Number.MAX_VALUE);
}

function isCoreScores(value: unknown): value is CoreScores {
  return isRecord(value)
    && hasOnlyKeys(value, CORE_CODES)
    && CORE_CODES.every((code) => isNumberInRange(value[code], 0, 100));
}

function isStateScores(value: unknown): value is StateScores {
  return isRecord(value)
    && hasOnlyKeys(value, STATE_CODES)
    && STATE_CODES.every((code) => isNumberInRange(value[code], 0, 100));
}

function isWeather(value: unknown): value is WeatherResult {
  return isRecord(value)
    && hasOnlyKeys(value, ['code', 'isBoundary'])
    && typeof value.code === 'string'
    && WEATHER_CODES.has(value.code as WeatherResult['code'])
    && typeof value.isBoundary === 'boolean';
}

function isStandout(value: unknown): value is StandoutResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ['dimension', 'direction'])) {
    return false;
  }

  if (value.dimension === 'BALANCED') {
    return value.direction === 'balanced';
  }

  return typeof value.dimension === 'string'
    && CORE_CODES.includes(value.dimension as (typeof CORE_CODES)[number])
    && (value.direction === 'low' || value.direction === 'high');
}

function isFacetResult(value: unknown): value is FacetResult {
  return isRecord(value)
    && hasOnlyKeys(value, [
      'id',
      'createdAt',
      'coreScores',
      'stateScores',
      'primary',
      'adjacent',
      'clarity',
      'weather',
      'standout',
    ])
    && typeof value.id === 'string'
    && value.id.trim().length > 0
    && typeof value.createdAt === 'string'
    && value.createdAt.trim().length > 0
    && isCoreScores(value.coreScores)
    && isStateScores(value.stateScores)
    && isRankedArchetypeResult(value.primary)
    && isRankedArchetypeResult(value.adjacent)
    && typeof value.clarity === 'string'
    && CLARITIES.has(value.clarity as Clarity)
    && isWeather(value.weather)
    && isStandout(value.standout);
}

function isStringTuple(value: unknown): value is readonly [string, string, string] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((entry) => typeof entry === 'string');
}

function isLegacyRankedArchetype(value: unknown): value is Record<string, unknown> & {
  code: ArchetypeCode;
  distance: number;
} {
  if (!isRecord(value)
    || !hasOnlyKeys(value, [
      'code',
      'name',
      'pattern',
      'hook',
      'strengths',
      'pitfalls',
      'relationshipNeed',
      'action',
      'distance',
    ])
    || typeof value.code !== 'string'
    || !ARCHETYPE_CODES.has(value.code as ArchetypeCode)
    || !isNumberInRange(value.distance, 0, Number.MAX_VALUE)
    || typeof value.name !== 'string'
    || typeof value.hook !== 'string'
    || !isStringTuple(value.strengths)
    || !isStringTuple(value.pitfalls)
    || typeof value.relationshipNeed !== 'string'
    || typeof value.action !== 'string'
    || !Array.isArray(value.pattern)
    || value.pattern.length !== 6
    || !value.pattern.every((level) => typeof level === 'string' && LEVELS.has(level))) {
    return false;
  }

  const stablePattern = ARCHETYPE_PATTERNS.get(value.code as ArchetypeCode);
  const legacyPattern = value.pattern as unknown[];
  return stablePattern !== undefined
    && stablePattern.every((level, index) => legacyPattern[index] === level);
}

function isLegacyStandout(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)
    || !hasOnlyKeys(value, ['dimension', 'direction', 'label'])
    || typeof value.label !== 'string') {
    return false;
  }

  if (value.dimension === 'BALANCED') {
    return value.direction === 'balanced';
  }

  return typeof value.dimension === 'string'
    && CORE_CODES.includes(value.dimension as (typeof CORE_CODES)[number])
    && (value.direction === 'low' || value.direction === 'high');
}

function normalizeLegacyResult(value: unknown): FacetResult | null {
  if (isFacetResult(value)) {
    return value;
  }

  if (!isRecord(value)
    || !hasOnlyKeys(value, [
      'id',
      'createdAt',
      'coreScores',
      'stateScores',
      'primary',
      'adjacent',
      'clarity',
      'weather',
      'standout',
    ])
    || typeof value.id !== 'string'
    || value.id.trim().length === 0
    || typeof value.createdAt !== 'string'
    || value.createdAt.trim().length === 0
    || !isCoreScores(value.coreScores)
    || !isStateScores(value.stateScores)
    || !isLegacyRankedArchetype(value.primary)
    || !isLegacyRankedArchetype(value.adjacent)
    || typeof value.clarity !== 'string'
    || !CLARITIES.has(value.clarity as Clarity)
    || !isWeather(value.weather)
    || !isLegacyStandout(value.standout)) {
    return null;
  }

  return {
    id: value.id,
    createdAt: value.createdAt,
    coreScores: value.coreScores,
    stateScores: value.stateScores,
    primary: {
      code: value.primary.code,
      distance: value.primary.distance,
    },
    adjacent: {
      code: value.adjacent.code,
      distance: value.adjacent.distance,
    },
    clarity: value.clarity as Clarity,
    weather: value.weather,
    standout: {
      dimension: value.standout.dimension as StandoutResult['dimension'],
      direction: value.standout.direction as StandoutResult['direction'],
    },
  };
}

function isStoredHistoryV2(value: unknown): value is StoredHistoryV2 {
  return isRecord(value)
    && hasOnlyKeys(value, ['version', 'results'])
    && value.version === 2
    && Array.isArray(value.results)
    && value.results.every(isFacetResult);
}

function newestDistinct(results: readonly FacetResult[]): FacetResult[] {
  const seen = new Set<string>();
  const distinct: FacetResult[] = [];

  for (const result of results) {
    if (seen.has(result.id)) {
      continue;
    }
    seen.add(result.id);
    distinct.push(result);
    if (distinct.length === 3) {
      break;
    }
  }

  return distinct;
}

function normalizeLegacyHistory(value: unknown): FacetResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map(normalizeLegacyResult)
    .filter((result): result is FacetResult => result !== null);
  return newestDistinct(normalized);
}

interface StoredJsonRead {
  exists: boolean;
  value: unknown;
}

function readStoredJson(storage: Storage, key: string): StoredJsonRead {
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { exists: false, value: null };
    }
    try {
      return { exists: true, value: JSON.parse(raw) };
    } catch {
      return { exists: true, value: null };
    }
  } catch {
    return { exists: true, value: null };
  }
}

export function loadHistory(storage: Storage = localStorage): FacetResult[] {
  const current = readStoredJson(storage, HISTORY_KEY);
  if (current.exists) {
    return isStoredHistoryV2(current.value)
      ? newestDistinct(current.value.results)
      : [];
  }

  const legacy = readStoredJson(storage, LEGACY_HISTORY_KEY);
  if (!legacy.exists) {
    return [];
  }

  const migrated = normalizeLegacyHistory(legacy.value);
  writeJson(storage, HISTORY_KEY, { version: 2, results: migrated } satisfies StoredHistoryV2);
  return migrated;
}

export function appendHistory(result: FacetResult, storage: Storage = localStorage): boolean {
  if (!isFacetResult(result)) {
    return false;
  }

  const existing = loadHistory(storage).filter((entry) => entry.id !== result.id);
  const results = [result, ...existing].slice(0, 3);
  return writeJson(storage, HISTORY_KEY, { version: 2, results } satisfies StoredHistoryV2);
}

export function clearAllLocalData(storage: Storage = localStorage): boolean {
  let success = true;
  for (const key of [PROGRESS_KEY, LEGACY_HISTORY_KEY, HISTORY_KEY, LOCALE_KEY]) {
    try {
      storage.removeItem(key);
    } catch {
      success = false;
    }
  }
  return success;
}
