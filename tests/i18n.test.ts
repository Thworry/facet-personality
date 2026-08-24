import { describe, expect, it } from 'vitest';
import { ARCHETYPES } from '../src/data/archetypes';
import { DIMENSION_COPY, WEATHER_COPY } from '../src/data/copy';
import { QUESTIONS } from '../src/data/questions';
import { CATALOGS, getCatalog } from '../src/i18n/catalog';
import type { Locale, LocaleCatalog } from '../src/i18n/types';

const ENGLISH_QUESTIONS = [
  "Even without anyone's approval, I can tell whether something matters to me.",
  'When everyone around me disagrees with an important choice, I immediately start doubting my judgment.',
  'A change in how others see me usually does not rewrite how I understand myself.',
  "I often need other people's reactions to know whether I made the right call.",
  'When something is worth doing, I usually begin before the pressure really arrives.',
  'Without a clear deadline, many ideas stay stuck at “getting ready to get ready.”',
  'Even when the steps are not complete, I am willing to take one small, reversible step.',
  "Deadlines or other people's reminders often have to press my start button.",
  'When I go somewhere or start a project, a rough route map helps me relax.',
  'When a plan gets too detailed, I start to feel that it gets in the way of action.',
  'When something unexpected changes, I first reorder the plan instead of improvising everything.',
  'I often decide what to do once I am there, and usually do not see that as a problem.',
  'After spending time with people I like, I often have more energy than I did before.',
  'Even after an enjoyable gathering, I need time alone to recharge.',
  'In an unfamiliar setting, I am usually willing to send the first social signal.',
  'If nobody speaks to me, I rarely start a conversation just to warm up the room.',
  "When someone else's emotions are intense, I can still tell which feelings are theirs and which are mine.",
  "Once a relationship becomes close, I easily put the other person's needs ahead of my own by default.",
  'Even in a close relationship, I can say no to something I do not want to take on.',
  'To avoid disappointing someone, I often say yes first and deal with my discomfort alone later.',
  'When I notice a problem, I would rather say it clearly than wait for the other person to figure it out.',
  'I decide how much of the same honest thought to express based on the person and the situation.',
  'Even if it may be briefly awkward, I do not like leaving an important disagreement hanging.',
  'I am better at communicating through tone, timing, and what I leave unsaid than by spelling everything out at once.',
  'Over the past two weeks, even small things have filled up my attention.',
  'Over the past two weeks, most days I have still had some time that was not being chased by my to-do list.',
  'Over the past two weeks, my mind has often kept working on unfinished tasks even while I was resting.',
  'Over the past two weeks, one more unexpected task usually has not made me feel immediately overwhelmed.',
  'Over the past two weeks, after a setback, I have usually returned to my rhythm fairly quickly.',
  'Over the past two weeks, the feelings from one event have looped in my head for a long time.',
  'Over the past two weeks, I have known which specific activities genuinely help me recover, and I have actually done them.',
  'Over the past two weeks, even when I had free time, I often did not know how to get the kind of rest I needed.',
] as const;

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string' || Array.isArray(value)) {
    return [prefix];
  }
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) => flattenKeys(child, prefix === '' ? key : `${prefix}.${key}`))
    .sort();
}

function metadataFor(locale: Locale) {
  const questionIds = Object.keys(getCatalog(locale).questions).map(Number);
  return questionIds
    .map((id) => {
      const question = QUESTIONS.find((candidate) => candidate.id === id);
      if (question === undefined) {
        throw new Error(`Missing question definition: ${id}`);
      }
      return {
        id: question.id,
        dimension: question.dimension,
        direction: question.direction,
        timeframe: question.timeframe,
      };
    })
    .sort((left, right) => left.id - right.id);
}

describe('locale catalogs', () => {
  it('registers two complete catalogs with identical leaf keys', () => {
    expect(Object.keys(CATALOGS).sort()).toEqual(['en', 'zh-CN']);
    expect(flattenKeys(CATALOGS.en)).toEqual(flattenKeys(CATALOGS['zh-CN']));
    expect(getCatalog('en')).toBe(CATALOGS.en);
    expect(getCatalog('zh-CN')).toBe(CATALOGS['zh-CN']);
    expect(CATALOGS.en.meta.locale).toBe('en');
    expect(CATALOGS['zh-CN'].meta.locale).toBe('zh-CN');
  });

  it('fails loudly when development code requests a missing catalog', () => {
    expect(() => getCatalog('missing' as Locale)).toThrowError(
      'Missing FACET locale catalog: missing',
    );
  });

  it('uses an explicit contract without permissive section or copy keys', () => {
    const catalog: LocaleCatalog = CATALOGS.en;
    expect(catalog.meta.locale).toBe('en');
    // @ts-expect-error Unknown top-level sections must not be accepted by LocaleCatalog.
    void catalog.unapprovedSection;
    // @ts-expect-error Unknown nested copy keys must not be accepted either.
    void catalog.landing.unapprovedCopy;
  });

  it('covers every question and keeps the approved Chinese prompts byte-for-byte', () => {
    const expectedIds = QUESTIONS.map(({ id }) => id);
    expect(Object.keys(CATALOGS.en.questions).map(Number).sort((a, b) => a - b)).toEqual(expectedIds);
    expect(Object.keys(CATALOGS['zh-CN'].questions).map(Number).sort((a, b) => a - b)).toEqual(expectedIds);
    expect(expectedIds.map((id) => CATALOGS['zh-CN'].questions[id])).toEqual(
      QUESTIONS.map(({ prompt }) => prompt),
    );
  });

  it('moves the approved Chinese domain copy without drift', () => {
    expect(CATALOGS['zh-CN'].dimensions).toEqual(DIMENSION_COPY);
    expect(CATALOGS['zh-CN'].weather).toEqual(WEATHER_COPY);
    for (const {
      code,
      name,
      hook,
      strengths,
      pitfalls,
      relationshipNeed,
      action,
    } of ARCHETYPES) {
      expect(CATALOGS['zh-CN'].archetypes[code]).toEqual({
        name,
        hook,
        strengths,
        pitfalls,
        relationshipNeed,
        action,
      });
    }
  });

  it('uses every approved English prompt verbatim', () => {
    expect(ENGLISH_QUESTIONS.map((_, index) => getCatalog('en').questions[index + 1])).toEqual(
      ENGLISH_QUESTIONS,
    );
    expect(CATALOGS.en.questions[25]).toMatch(/past two weeks/i);
    expect(CATALOGS.en.questions[32]).toMatch(/past two weeks/i);
  });

  it('keeps question scoring metadata independent from language', () => {
    const chineseMetadata = metadataFor('zh-CN');
    const englishMetadata = metadataFor('en');
    expect(englishMetadata).toEqual(chineseMetadata);
    expect(chineseMetadata).toMatchInlineSnapshot(`
      [
        {
          "dimension": "F1",
          "direction": "forward",
          "id": 1,
          "timeframe": "usual",
        },
        {
          "dimension": "F1",
          "direction": "reverse",
          "id": 2,
          "timeframe": "usual",
        },
        {
          "dimension": "F1",
          "direction": "forward",
          "id": 3,
          "timeframe": "usual",
        },
        {
          "dimension": "F1",
          "direction": "reverse",
          "id": 4,
          "timeframe": "usual",
        },
        {
          "dimension": "F2",
          "direction": "forward",
          "id": 5,
          "timeframe": "usual",
        },
        {
          "dimension": "F2",
          "direction": "reverse",
          "id": 6,
          "timeframe": "usual",
        },
        {
          "dimension": "F2",
          "direction": "forward",
          "id": 7,
          "timeframe": "usual",
        },
        {
          "dimension": "F2",
          "direction": "reverse",
          "id": 8,
          "timeframe": "usual",
        },
        {
          "dimension": "F3",
          "direction": "forward",
          "id": 9,
          "timeframe": "usual",
        },
        {
          "dimension": "F3",
          "direction": "reverse",
          "id": 10,
          "timeframe": "usual",
        },
        {
          "dimension": "F3",
          "direction": "forward",
          "id": 11,
          "timeframe": "usual",
        },
        {
          "dimension": "F3",
          "direction": "reverse",
          "id": 12,
          "timeframe": "usual",
        },
        {
          "dimension": "F4",
          "direction": "forward",
          "id": 13,
          "timeframe": "usual",
        },
        {
          "dimension": "F4",
          "direction": "reverse",
          "id": 14,
          "timeframe": "usual",
        },
        {
          "dimension": "F4",
          "direction": "forward",
          "id": 15,
          "timeframe": "usual",
        },
        {
          "dimension": "F4",
          "direction": "reverse",
          "id": 16,
          "timeframe": "usual",
        },
        {
          "dimension": "F5",
          "direction": "forward",
          "id": 17,
          "timeframe": "usual",
        },
        {
          "dimension": "F5",
          "direction": "reverse",
          "id": 18,
          "timeframe": "usual",
        },
        {
          "dimension": "F5",
          "direction": "forward",
          "id": 19,
          "timeframe": "usual",
        },
        {
          "dimension": "F5",
          "direction": "reverse",
          "id": 20,
          "timeframe": "usual",
        },
        {
          "dimension": "F6",
          "direction": "forward",
          "id": 21,
          "timeframe": "usual",
        },
        {
          "dimension": "F6",
          "direction": "reverse",
          "id": 22,
          "timeframe": "usual",
        },
        {
          "dimension": "F6",
          "direction": "forward",
          "id": 23,
          "timeframe": "usual",
        },
        {
          "dimension": "F6",
          "direction": "reverse",
          "id": 24,
          "timeframe": "usual",
        },
        {
          "dimension": "W1",
          "direction": "forward",
          "id": 25,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W1",
          "direction": "reverse",
          "id": 26,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W1",
          "direction": "forward",
          "id": 27,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W1",
          "direction": "reverse",
          "id": 28,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W2",
          "direction": "forward",
          "id": 29,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W2",
          "direction": "reverse",
          "id": 30,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W2",
          "direction": "forward",
          "id": 31,
          "timeframe": "two-weeks",
        },
        {
          "dimension": "W2",
          "direction": "reverse",
          "id": 32,
          "timeframe": "two-weeks",
        },
      ]
    `);
  });

  it('covers all fixed domain records and tuple lengths', () => {
    expect(Object.keys(CATALOGS.en.archetypes).sort()).toEqual(
      ARCHETYPES.map(({ code }) => code).sort(),
    );
    expect(Object.keys(CATALOGS.en.dimensions)).toHaveLength(8);
    expect(Object.keys(CATALOGS.en.weather)).toHaveLength(4);
    expect(CATALOGS.en.quiz.answerLabels).toHaveLength(5);
    expect(CATALOGS.en.quiz.answerLabels).toEqual([
      'Not like me at all',
      'Not much like me',
      'Somewhere in the middle',
      'Mostly like me',
      'Very much like me',
    ]);
    for (const locale of ['zh-CN', 'en'] as const) {
      for (const archetype of Object.values(CATALOGS[locale].archetypes)) {
        expect(archetype.strengths).toHaveLength(3);
        expect(archetype.pitfalls).toHaveLength(3);
      }
    }
  });

  it('does not ship empty leaf copy', () => {
    function collectLeaves(value: unknown): unknown[] {
      if (Array.isArray(value)) {
        return value.flatMap(collectLeaves);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).flatMap(collectLeaves);
      }
      return [value];
    }

    for (const locale of ['zh-CN', 'en'] as const) {
      expect(
        collectLeaves(CATALOGS[locale]).every(
          (leaf) => typeof leaf === 'string' && leaf.trim().length > 0,
        ),
      ).toBe(true);
    }
  });

  it('uses the approved English domain labels and archetype names', () => {
    expect(Object.values(CATALOGS.en.dimensions).map(({ name }) => name)).toEqual([
      'Inner Compass',
      'Starting Rhythm',
      'Planning Style',
      'Social Recharge',
      'Boundary Strength',
      'Expression Strategy',
      'Load Level',
      'Recovery Flexibility',
    ]);
    expect(Object.values(CATALOGS.en.weather).map(({ name }) => name)).toEqual([
      'Clear Skies',
      'Slow Fog',
      'Overclocked',
      'Thunderstorm',
    ]);
    expect(Object.fromEntries(Object.entries(CATALOGS.en.archetypes).map(([code, copy]) => [code, copy.name])))
      .toEqual({
        BUFFER: 'Buffer',
        BOOST: 'Booster',
        NEST: 'Haven',
        ARCHIVE: 'Archive',
        SIGNAL: 'Beacon',
        PATCH: 'Fixer',
        TOWER: 'Lookout',
        SCOUT: 'Scout',
        RADAR: 'Radar',
        PRISM: 'Prism',
        ROUTER: 'Router',
        BRIDGE: 'Bridge',
      });
  });

  it('uses the approved tone anchors without softening direct safety copy', () => {
    expect(CATALOGS['zh-CN'].landing.deckLead).toBe('不测你是不是天选之子，只看看你的系统默认怎么跑。');
    expect(CATALOGS['zh-CN'].intro.realityCheck).toBe('理想人设可以先去喝口水，这里只看平时真正会上线的你。');
    expect(CATALOGS['zh-CN'].chapter.lead).toBe('核心线路读完。接下来看看最近两周，后台是不是偷偷开了太多进程。');
    expect(CATALOGS['zh-CN'].result.operatingNotes).toBe('你的运行说明书——没有保修卡，但有使用建议。');
    expect(CATALOGS['zh-CN'].feedback.shareSuccess).toBe('分享卡已经烤好，逐题答案没有离开浏览器半步。');
    expect(CATALOGS['zh-CN'].history.emptyLead).toBe('档案目前很安静，连灰尘都还没来得及积。');
    expect(CATALOGS.en.landing.deckLead).toBe('No destiny. No rarest-type leaderboard. Just a closer look at your default settings.');
    expect(CATALOGS.en.intro.realityCheck).toBe('Let your aspirational alter ego take a coffee break. Answer for the version of you that actually shows up.');
    expect(CATALOGS.en.chapter.lead).toBe('Core route mapped. Now let’s check what has been running in the background for the past two weeks.');
    expect(CATALOGS.en.result.operatingNotes).toBe('Your operating notes — warranty not included, practical guidance included.');
    expect(CATALOGS.en.feedback.shareSuccess).toBe('Your card was baked locally. Your individual answers never left the browser.');
    expect(CATALOGS.en.history.emptyLead).toBe('The archive is quiet. Even the dust has not checked in yet.');
    expect(CATALOGS.en.result.disclaimer).toMatch(/not.*diagnos/i);
    expect(CATALOGS.en.history.clearDialogBody).toMatch(/delete/i);
    expect(CATALOGS.en.feedback.quizResultFailure).toMatch(/try again/i);
  });

  it('keeps exact journey, share, and reviewed archetype copy contracts', () => {
    expect(CATALOGS['zh-CN'].meta.title).toBe('FACET｜人格切面');
    expect(CATALOGS.en.meta.title).toBe('FACET | Personality Facets');
    expect(CATALOGS.en.intro.title).toBe(
      'Answer for how you actually operate, not your idealized version.',
    );
    expect(CATALOGS.en.share.disclaimer).toContain('For entertainment and self-reflection');
    expect(CATALOGS.en.archetypes.ARCHIVE.action).toBe(
      'Choose one matter you have already filed internally and tell the relevant person three things this week: what happened, how you feel, and what you hope for.',
    );
    expect(CATALOGS.en.archetypes.PRISM.relationshipNeed).toBe(
      'You need others to understand that measured delivery is not dismissiveness, while allowing you to mark the core position that does not change.',
    );
  });
});
