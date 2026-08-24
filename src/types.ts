export type CoreDimension = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
export type StateDimension = 'W1' | 'W2';
export type DimensionCode = CoreDimension | StateDimension;
export type Direction = 'forward' | 'reverse';
export type Level = 'L' | 'M' | 'H';
export type WeatherCode = 'CLEAR' | 'MIST' | 'TURBO' | 'STORM';
export type Clarity = 'dual' | 'leaning' | 'clear' | 'free';

export interface Question {
  id: number;
  dimension: DimensionCode;
  direction: Direction;
  prompt: string;
  timeframe: 'usual' | 'two-weeks';
}

export interface Archetype {
  code: string;
  name: string;
  pattern: readonly [Level, Level, Level, Level, Level, Level];
  hook: string;
  strengths: readonly [string, string, string];
  pitfalls: readonly [string, string, string];
  relationshipNeed: string;
  action: string;
}

export type Answers = Partial<Record<number, 1 | 2 | 3 | 4 | 5>>;
export type CoreScores = Record<CoreDimension, number>;
export type StateScores = Record<StateDimension, number>;

export interface RankedArchetype extends Archetype {
  distance: number;
}

export interface WeatherResult {
  code: WeatherCode;
  isBoundary: boolean;
}

export interface StandoutResult {
  dimension: CoreDimension | 'BALANCED';
  direction: 'low' | 'high' | 'balanced';
  label: string;
}

export interface FacetResult {
  id: string;
  createdAt: string;
  coreScores: CoreScores;
  stateScores: StateScores;
  primary: RankedArchetype;
  adjacent: RankedArchetype;
  clarity: Clarity;
  weather: WeatherResult;
  standout: StandoutResult;
}
