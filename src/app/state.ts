import { QUESTIONS } from '../data/questions';
import type { SavedProgress } from '../domain/storage';
import type { Answers, FacetResult } from '../types';

export type AppRoute = 'landing' | 'intro' | 'quiz' | 'result' | 'atlas' | 'history';
type ReturnRoute = Exclude<AppRoute, 'atlas' | 'history'>;
export type AnswerValue = 1 | 2 | 3 | 4 | 5;

export interface AppState {
  route: AppRoute;
  returnRoute: ReturnRoute;
  index: number;
  order: number[];
  answers: Answers;
  result: FacetResult | null;
  chapterIntroVisible: boolean;
}

export type AppAction =
  | { type: 'START' }
  | { type: 'BEGIN_QUIZ'; order: number[] }
  | { type: 'ANSWER'; questionId: number; value: AnswerValue }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SHOW_ATLAS' }
  | { type: 'SHOW_HISTORY' }
  | { type: 'SHOW_RESULT'; result: FacetResult }
  | { type: 'RETEST_WEATHER'; order: number[] }
  | { type: 'RESET' };

export type RandomSource = () => number;

function cryptoRandom(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0]! / 0x1_0000_0000;
}

function shuffled(values: readonly number[], random: RandomSource): number[] {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const sample = Math.max(0, Math.min(0.9999999999999999, random()));
    const swapIndex = Math.floor(sample * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex]!, output[index]!];
  }
  return output;
}

export function createQuestionOrder(random: RandomSource = cryptoRandom): number[] {
  const core = QUESTIONS.filter((question) => question.timeframe === 'usual').map((question) => question.id);
  const recent = QUESTIONS.filter((question) => question.timeframe === 'two-weeks').map((question) => question.id);
  return [...shuffled(core, random), ...shuffled(recent, random)];
}

export function createInitialState(order: number[] = createQuestionOrder()): AppState {
  return {
    route: 'landing',
    returnRoute: 'landing',
    index: 0,
    order: [...order],
    answers: {},
    result: null,
    chapterIntroVisible: false,
  };
}

export function restoreAppState(progress: SavedProgress): AppState {
  return {
    route: progress.route,
    returnRoute: progress.route,
    index: progress.index,
    order: [...progress.order],
    answers: { ...progress.answers },
    result: null,
    chapterIntroVisible: false,
  };
}

export function canCompleteQuiz(answers: Answers): boolean {
  return QUESTIONS.every((question) => {
    const answer = answers[question.id];
    return answer !== undefined && answer >= 1 && answer <= 5;
  });
}

export function isStateChapter(index: number): boolean {
  return index >= 24;
}

export function toSavedProgress(state: AppState): SavedProgress | null {
  if (state.route !== 'intro' && state.route !== 'quiz') {
    return null;
  }
  return {
    version: 1,
    route: state.route,
    index: state.index,
    order: [...state.order],
    answers: { ...state.answers },
  };
}

function getReturnRoute(route: AppRoute, fallback: ReturnRoute): ReturnRoute {
  return route === 'atlas' || route === 'history' ? fallback : route;
}

export function reduceAppState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        route: 'intro',
        returnRoute: 'intro',
        index: 0,
        answers: {},
        result: null,
        chapterIntroVisible: false,
      };
    case 'BEGIN_QUIZ':
      return {
        ...state,
        route: 'quiz',
        returnRoute: 'quiz',
        index: 0,
        order: [...action.order],
        answers: {},
        result: null,
        chapterIntroVisible: false,
      };
    case 'ANSWER': {
      if (state.route !== 'quiz' || state.order[state.index] !== action.questionId) {
        return state;
      }
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      };
    }
    case 'NEXT': {
      if (state.route !== 'quiz') {
        return state;
      }
      if (state.chapterIntroVisible) {
        return { ...state, chapterIntroVisible: false };
      }
      const currentQuestionId = state.order[state.index];
      if (currentQuestionId === undefined || state.answers[currentQuestionId] === undefined) {
        return state;
      }
      if (state.index >= state.order.length - 1) {
        return state;
      }
      const nextIndex = state.index + 1;
      return {
        ...state,
        index: nextIndex,
        chapterIntroVisible: nextIndex === 24,
      };
    }
    case 'BACK':
      if (state.route === 'quiz') {
        if (state.index === 0) {
          return { ...state, route: 'intro', returnRoute: 'intro', chapterIntroVisible: false };
        }
        return {
          ...state,
          index: state.chapterIntroVisible ? Math.max(0, state.index - 1) : state.index - 1,
          chapterIntroVisible: false,
        };
      }
      if (state.route === 'intro') {
        return { ...state, route: 'landing', returnRoute: 'landing' };
      }
      if (state.route === 'atlas' || state.route === 'history') {
        return { ...state, route: state.returnRoute };
      }
      if (state.route === 'result') {
        return { ...state, route: 'landing', returnRoute: 'landing' };
      }
      return state;
    case 'SHOW_ATLAS':
      return {
        ...state,
        route: 'atlas',
        returnRoute: getReturnRoute(state.route, state.returnRoute),
      };
    case 'SHOW_HISTORY':
      return {
        ...state,
        route: 'history',
        returnRoute: getReturnRoute(state.route, state.returnRoute),
      };
    case 'SHOW_RESULT':
      return {
        ...state,
        route: 'result',
        returnRoute: 'result',
        result: action.result,
        chapterIntroVisible: false,
      };
    case 'RETEST_WEATHER': {
      const coreAnswers = Object.fromEntries(
        Object.entries(state.answers).filter(([questionId]) => Number(questionId) <= 24),
      ) as Answers;
      return {
        ...state,
        route: 'quiz',
        returnRoute: 'quiz',
        index: 24,
        order: [...action.order],
        answers: coreAnswers,
        result: null,
        chapterIntroVisible: false,
      };
    }
    case 'RESET':
      return createInitialState(createQuestionOrder());
  }
}
