import { ARCHETYPE_DEFINITIONS } from '../data/archetypes';
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
export const HISTORY_KEY = 'facet:v1:history';

export interface SavedProgress {
  version: 1;
  route: 'intro' | 'quiz';
  index: number;
  order: number[];
  answers: Answers;
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
const ARCHETYPE_CODES = new Set<ArchetypeCode>(
  ARCHETYPE_DEFINITIONS.map((archetype) => archetype.code),
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
    && CORE_CODES.every((code) => isNumberInRange(value[code], 0, 100));
}

function isStateScores(value: unknown): value is StateScores {
  return isRecord(value)
    && isNumberInRange(value.W1, 0, 100)
    && isNumberInRange(value.W2, 0, 100);
}

function isWeather(value: unknown): value is WeatherResult {
  return isRecord(value)
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
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.createdAt === 'string'
    && value.createdAt.length > 0
    && isCoreScores(value.coreScores)
    && isStateScores(value.stateScores)
    && isRankedArchetypeResult(value.primary)
    && isRankedArchetypeResult(value.adjacent)
    && typeof value.clarity === 'string'
    && CLARITIES.has(value.clarity as Clarity)
    && isWeather(value.weather)
    && isStandout(value.standout);
}

export function loadHistory(storage: Storage = localStorage): FacetResult[] {
  const parsed = readJson(storage, HISTORY_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isFacetResult).slice(0, 3);
}

export function appendHistory(result: FacetResult, storage: Storage = localStorage): boolean {
  if (!isFacetResult(result)) {
    return false;
  }

  const existing = loadHistory(storage).filter((entry) => entry.id !== result.id);
  return writeJson(storage, HISTORY_KEY, [result, ...existing].slice(0, 3));
}

export function clearAllLocalData(storage: Storage = localStorage): boolean {
  let success = true;
  for (const key of [PROGRESS_KEY, HISTORY_KEY]) {
    try {
      storage.removeItem(key);
    } catch {
      success = false;
    }
  }
  return success;
}
