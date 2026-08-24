export type CoreDimension = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
export type StateDimension = 'W1' | 'W2';
export type DimensionCode = CoreDimension | StateDimension;
export type Direction = 'forward' | 'reverse';
export type Level = 'L' | 'M' | 'H';
export type WeatherCode = 'CLEAR' | 'MIST' | 'TURBO' | 'STORM';
export type Clarity = 'dual' | 'leaning' | 'clear' | 'free';
export type ArchetypeCode =
  | 'BUFFER'
  | 'BOOST'
  | 'NEST'
  | 'ARCHIVE'
  | 'SIGNAL'
  | 'PATCH'
  | 'TOWER'
  | 'SCOUT'
  | 'RADAR'
  | 'PRISM'
  | 'ROUTER'
  | 'BRIDGE';

export interface QuestionDefinition {
  id: number;
  dimension: DimensionCode;
  direction: Direction;
  timeframe: 'usual' | 'two-weeks';
}

export interface Question extends QuestionDefinition {
  prompt: string;
}

export interface ArchetypeDefinition {
  code: ArchetypeCode;
  pattern: readonly [Level, Level, Level, Level, Level, Level];
}

export interface Archetype extends ArchetypeDefinition {
  name: string;
  hook: string;
  strengths: readonly [string, string, string];
  pitfalls: readonly [string, string, string];
  relationshipNeed: string;
  action: string;
}

export type Answers = Partial<Record<number, 1 | 2 | 3 | 4 | 5>>;
export type CoreScores = Record<CoreDimension, number>;
export type StateScores = Record<StateDimension, number>;

/** @deprecated Rich Chinese source shape retained only until catalog injection completes. */
export interface RankedArchetype extends Archetype {
  distance: number;
}

export interface RankedArchetypeResult {
  code: ArchetypeCode;
  distance: number;
}

export interface WeatherResult {
  code: WeatherCode;
  isBoundary: boolean;
}

export interface StandoutResult {
  dimension: CoreDimension | 'BALANCED';
  direction: 'low' | 'high' | 'balanced';
}

export interface FacetResult {
  id: string;
  createdAt: string;
  coreScores: CoreScores;
  stateScores: StateScores;
  primary: RankedArchetypeResult;
  adjacent: RankedArchetypeResult;
  clarity: Clarity;
  weather: WeatherResult;
  standout: StandoutResult;
}
