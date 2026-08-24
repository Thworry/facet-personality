import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/data/questions';
import type { Answers } from '../src/types';
import {
  canCompleteQuiz,
  createInitialState,
  createQuestionOrder,
  reduceAppState,
  restoreAppState,
} from '../src/app/state';
import { renderIntro } from '../src/app/screens/intro';
import { renderLanding } from '../src/app/screens/landing';
import { renderQuiz } from '../src/app/screens/quiz';

const canonicalOrder = QUESTIONS.map((question) => question.id);

describe('question order', () => {
  it('shuffles the core and recent-state chapters independently', () => {
    const values = [0.91, 0.07, 0.63, 0.14, 0.82, 0.35];
    let index = 0;
    const order = createQuestionOrder(() => values[index++ % values.length]!);

    expect(order).toHaveLength(32);
    expect(new Set(order).size).toBe(32);
    expect(order.slice(0, 24).every((id) => id >= 1 && id <= 24)).toBe(true);
    expect(order.slice(24).every((id) => id >= 25 && id <= 32)).toBe(true);
    expect(order).not.toEqual(canonicalOrder);
  });
});

describe('application state reducer', () => {
  it('moves from landing to intro and begins the quiz with the supplied order', () => {
    const landing = createInitialState(canonicalOrder);
    const intro = reduceAppState(landing, { type: 'START' });
    const quiz = reduceAppState(intro, { type: 'BEGIN_QUIZ', order: [...canonicalOrder] });

    expect(intro.route).toBe('intro');
    expect(quiz).toMatchObject({ route: 'quiz', index: 0, chapterIntroVisible: false });
    expect(quiz.order).toEqual(canonicalOrder);
  });

  it('records an answer immutably and only advances after the current item is answered', () => {
    const quiz = reduceAppState(
      reduceAppState(createInitialState(canonicalOrder), { type: 'START' }),
      { type: 'BEGIN_QUIZ', order: [...canonicalOrder] },
    );
    const blocked = reduceAppState(quiz, { type: 'NEXT' });
    const answered = reduceAppState(quiz, { type: 'ANSWER', questionId: 1, value: 4 });
    const advanced = reduceAppState(answered, { type: 'NEXT' });

    expect(blocked).toBe(quiz);
    expect(answered.answers).toEqual({ 1: 4 });
    expect(quiz.answers).toEqual({});
    expect(advanced.index).toBe(1);
  });

  it('goes back through questions and returns to intro from the first question', () => {
    const base = restoreAppState({
      version: 1,
      route: 'quiz',
      index: 2,
      order: [...canonicalOrder],
      answers: { 1: 3, 2: 4, 3: 5 },
    });

    expect(reduceAppState(base, { type: 'BACK' }).index).toBe(1);
    expect(reduceAppState({ ...base, index: 0 }, { type: 'BACK' }).route).toBe('intro');
  });

  it('restores a saved order, index, and prior answers', () => {
    const order = [...canonicalOrder.slice(1, 24), 1, ...canonicalOrder.slice(24)];
    const restored = restoreAppState({
      version: 1,
      route: 'quiz',
      index: 5,
      order,
      answers: { 2: 5, 3: 2 },
    });

    expect(restored.route).toBe('quiz');
    expect(restored.index).toBe(5);
    expect(restored.order).toEqual(order);
    expect(restored.answers).toEqual({ 2: 5, 3: 2 });
  });

  it('shows the recent-two-weeks chapter once before question 25', () => {
    const answers = Object.fromEntries(canonicalOrder.slice(0, 24).map((id) => [id, 3])) as Answers;
    const beforeBoundary = restoreAppState({
      version: 1,
      route: 'quiz',
      index: 23,
      order: [...canonicalOrder],
      answers,
    });
    const chapter = reduceAppState(beforeBoundary, { type: 'NEXT' });
    const question25 = reduceAppState(chapter, { type: 'NEXT' });

    expect(chapter).toMatchObject({ index: 24, chapterIntroVisible: true });
    expect(question25).toMatchObject({ index: 24, chapterIntroVisible: false });
  });

  it('prevents completion until every answer exists', () => {
    const incomplete = Object.fromEntries(canonicalOrder.slice(0, 31).map((id) => [id, 3])) as Answers;
    const complete = Object.fromEntries(canonicalOrder.map((id) => [id, 3])) as Answers;

    expect(canCompleteQuiz(incomplete)).toBe(false);
    expect(canCompleteQuiz(complete)).toBe(true);
  });
});

describe('core screen markup', () => {
  it('renders the approved landing facts, privacy promise, and primary routes', () => {
    const html = renderLanding();

    expect(html).toContain('你不是一个类型');
    expect(html).toContain('32题');
    expect(html).toContain('约6分钟');
    expect(html).toContain('本地计算');
    expect(html).toContain('data-action="start"');
    expect(html).toContain('data-action="show-atlas"');
    expect(html).toContain('不上传逐题答案');
  });

  it('explains both timeframes and all five response labels before starting', () => {
    const html = renderIntro();

    expect(html).toContain('大多数情况下');
    expect(html).toContain('最近两周');
    for (const label of ['完全不像我', '不太像我', '一半一半', '比较像我', '非常像我']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('data-action="begin-quiz"');
    expect(html).not.toContain('<input');
  });

  it('renders one semantic radio group and a text alternative for progress', () => {
    const state = restoreAppState({
      version: 1,
      route: 'quiz',
      index: 0,
      order: [...canonicalOrder],
      answers: { 1: 4 },
    });
    const html = renderQuiz(state);

    expect(html).toContain('第 1 题，共 32 题');
    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/name="answer"/g)).toHaveLength(5);
    expect(html).toContain('value="4" checked');
    expect(html).toContain('data-action="next"');
  });

  it('renders the recent-state interstitial before question 25', () => {
    const state = {
      ...restoreAppState({
        version: 1,
        route: 'quiz',
        index: 24,
        order: [...canonicalOrder],
        answers: {},
      }),
      chapterIntroVisible: true,
    };
    const html = renderQuiz(state);

    expect(html).toContain('接下来只看最近两周');
    expect(html).toContain('data-action="next"');
    expect(html).not.toContain('name="answer"');
  });
});
