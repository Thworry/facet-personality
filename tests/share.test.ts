import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/data/questions';
import { CATALOGS } from '../src/i18n/catalog';
import { buildFacetResult } from '../src/domain/result';
import { drawShareCard, type ShareCanvasContext } from '../src/domain/share';
import type { Answers } from '../src/types';

class RecordingContext implements ShareCanvasContext {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000';
  lineWidth = 1;
  font = '';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  readonly text: string[] = [];
  readonly textCalls: Array<{ value: string; y: number; fillStyle: string }> = [];
  readonly scales: Array<[number, number]> = [];

  save(): void {}
  restore(): void {}
  fillRect(): void {}
  beginPath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  stroke(): void {}
  arc(): void {}
  fill(): void {}

  scale(x: number, y: number): void {
    this.scales.push([x, y]);
  }

  fillText(value: string, _x: number, y: number): void {
    this.text.push(value);
    this.textCalls.push({ value, y, fillStyle: String(this.fillStyle) });
  }

  measureText(value: string): Pick<TextMetrics, 'width'> {
    return {
      width: [...value].reduce(
        (width, character) => width + (/\p{Script=Han}/u.test(character) ? 28 : 14),
        0,
      ),
    };
  }
}

const neutralAnswers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 3])) as Answers;

describe('local share-card renderer', () => {
  it('draws the required identity, weather, standout, adjacent, and boundary copy', () => {
    const result = buildFacetResult(neutralAnswers, 'share-result', '2026-08-24T00:00:00.000Z');
    const zhCatalog = CATALOGS['zh-CN'];
    const primaryCopy = zhCatalog.archetypes[result.primary.code];
    const adjacentCopy = zhCatalog.archetypes[result.adjacent.code];
    const dimensions = zhCatalog.dimensions;
    const standout = (() => {
      const dimension = result.standout.dimension;
      if (result.standout.direction === 'balanced') {
        return zhCatalog.result.balancedStandout;
      }
      if (result.standout.direction === 'low') {
        if (dimension === 'BALANCED') {
          throw new Error('Balanced result should not have low direction');
        }
        return dimensions[dimension].lowLabel;
      }
      if (dimension === 'BALANCED') {
        throw new Error('Balanced result should not have high direction');
      }
      return dimensions[dimension].highLabel;
    })();
    const context = new RecordingContext();

    drawShareCard(context, result, zhCatalog, 1);

    const text = context.text.join(' ');
    expect(text).toContain('FACET');
    expect(text).toContain(result.primary.code);
    expect(text).toContain(primaryCopy.name);
    expect(text).toContain(result.weather.code);
    expect(text).toContain(standout);
    expect(text).toContain(adjacentCopy.name);
    expect(text).toContain('娱乐向自我观察');
    expect(text).not.toContain(String(result.coreScores.F1));
  });

  it('applies the requested drawing scale without changing card copy', () => {
    const result = buildFacetResult(neutralAnswers, 'scaled-result', '2026-08-24T00:00:00.000Z');
    const primaryCopy = CATALOGS['zh-CN'].archetypes[result.primary.code];
    const context = new RecordingContext();

    drawShareCard(context, result, CATALOGS['zh-CN'], 2);

    expect(context.scales).toContainEqual([2, 2]);
    expect(context.text.join(' ')).toContain(primaryCopy.name);
  });

  it('supports bilingual branding and copy in the share card', () => {
    const result = buildFacetResult(neutralAnswers, 'share-card-result', '2026-08-24T00:00:00.000Z');

    const zhContext = new RecordingContext();
    const zhCopy = CATALOGS['zh-CN'];
    drawShareCard(zhContext, result, zhCopy, 1);
    const zhText = zhContext.text.join(' ');

    expect(zhText).toContain('娱乐向自我观察');
    expect(zhText).toContain(zhCopy.archetypes[result.primary.code].name);

    const enContext = new RecordingContext();
    const enCopy = CATALOGS.en;
    drawShareCard(enContext, result, enCopy, 1);
    const enText = enContext.text.join(' ');

    expect(enText).toContain('For entertainment and self-reflection');
    expect(enText).toContain(enCopy.archetypes[result.primary.code].name);
  });

  it('wraps English copy at word boundaries and keeps punctuation intact', () => {
    const result = buildFacetResult(neutralAnswers, 'english-wrap-result', '2026-08-24T00:00:00.000Z');
    const context = new RecordingContext();

    drawShareCard(context, result, CATALOGS.en, 1);
    const lines = context.text.filter((line) => line.length > 0);

    const expectedWords = ['Your', 'operating', 'notes', '—', 'warranty', 'not', 'included,', 'practical', 'guidance', 'included.'];
    for (const word of expectedWords) {
      expect(lines.some((line) => line.includes(word))).toBe(true);
    }
    expect(lines.some((line) => line.includes('included.'))).toBe(true);
  });

  it('keeps every English operating-note line inside the dark panel', () => {
    const result = buildFacetResult(neutralAnswers, 'english-panel-result', '2026-08-24T00:00:00.000Z');
    const context = new RecordingContext();

    drawShareCard(context, result, CATALOGS.en, 1);

    const operatingStart = context.textCalls.findIndex(({ value }) => value.includes('Your operating notes'));
    const operatingEnd = context.textCalls.findIndex(
      ({ value }, index) => index >= operatingStart && value.includes('included.'),
    );
    const operatingCalls = context.textCalls.slice(operatingStart, operatingEnd + 1);

    expect(operatingStart).toBeGreaterThanOrEqual(0);
    expect(operatingEnd).toBeGreaterThanOrEqual(operatingStart);
    expect(operatingCalls.map(({ value }) => value).join(' ')).toContain('warranty not included');
    expect(operatingCalls.at(-1)?.value).toContain('included.');
    expect(operatingCalls.every(({ fillStyle }) => fillStyle === '#F8F5EF')).toBe(true);
    expect(Math.max(...operatingCalls.map(({ y }) => y))).toBeLessThanOrEqual(884);
  });
});
