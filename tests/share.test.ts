import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../src/data/questions';
import { BALANCED_STANDOUT, DIMENSION_COPY } from '../src/data/copy';
import { getLegacyArchetypeCopy } from '../src/data/archetypes';
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

  fillText(value: string): void {
    this.text.push(value);
  }

  measureText(value: string): Pick<TextMetrics, 'width'> {
    return { width: [...value].length * 28 };
  }
}

const neutralAnswers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 3])) as Answers;

describe('local share-card renderer', () => {
  it('draws the required identity, weather, standout, adjacent, and boundary copy', () => {
    const result = buildFacetResult(neutralAnswers, 'share-result', '2026-08-24T00:00:00.000Z');
    const primaryCopy = getLegacyArchetypeCopy(result.primary.code);
    const adjacentCopy = getLegacyArchetypeCopy(result.adjacent.code);
    const standout = (() => {
      const dimension = result.standout.dimension;
      if (result.standout.direction === 'balanced') {
        return BALANCED_STANDOUT.label;
      }
      if (result.standout.direction === 'low') {
        if (dimension === 'BALANCED') {
          throw new Error('Balanced result should not have low direction');
        }
        return DIMENSION_COPY[dimension].lowLabel;
      }
      if (dimension === 'BALANCED') {
        throw new Error('Balanced result should not have high direction');
      }
      return DIMENSION_COPY[dimension].highLabel;
    })();
    const context = new RecordingContext();

    drawShareCard(context, result, 1);

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
    const primaryCopy = getLegacyArchetypeCopy(result.primary.code);
    const context = new RecordingContext();

    drawShareCard(context, result, 2);

    expect(context.scales).toContainEqual([2, 2]);
    expect(context.text.join(' ')).toContain(primaryCopy.name);
  });
});
