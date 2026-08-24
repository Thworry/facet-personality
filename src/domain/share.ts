import { BALANCED_STANDOUT, DIMENSION_COPY, WEATHER_COPY } from '../data/copy';
import { getLegacyArchetypeCopy } from '../data/archetypes';
import type { FacetResult } from '../types';

export interface ShareCanvasContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): Pick<TextMetrics, 'width'>;
}

function drawWrappedText(
  context: ShareCanvasContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const lines: string[] = [];
  let current = '';
  for (const character of [...text]) {
    const candidate = current + character;
    if (current !== '' && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current !== '') {
    lines.push(current);
  }

  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((line, index) => {
    const isLastClippedLine = index === maxLines - 1 && lines.length > maxLines;
    context.fillText(isLastClippedLine ? `${line.slice(0, -1)}…` : line, x, y + index * lineHeight);
  });
  return y + visibleLines.length * lineHeight;
}

function drawTransitLine(context: ShareCanvasContext): void {
  context.strokeStyle = '#F4553D';
  context.lineWidth = 12;
  context.beginPath();
  context.moveTo(88, 1170);
  context.lineTo(300, 1050);
  context.lineTo(520, 1130);
  context.lineTo(760, 1010);
  context.lineTo(992, 1080);
  context.stroke();

  const stations = [
    [88, 1170],
    [300, 1050],
    [520, 1130],
    [760, 1010],
    [992, 1080],
  ] as const;
  context.fillStyle = '#C9F66F';
  for (const [x, y] of stations) {
    context.beginPath();
    context.arc(x, y, 18, 0, Math.PI * 2);
    context.fill();
  }
}

function standoutText(standout: FacetResult['standout']): string {
  if (standout.dimension === 'BALANCED') {
    return BALANCED_STANDOUT.label;
  }

  const dimensionCopy = DIMENSION_COPY[standout.dimension];
  if (standout.direction === 'low') {
    return dimensionCopy.lowLabel;
  }
  if (standout.direction === 'high') {
    return dimensionCopy.highLabel;
  }
  throw new Error(`Invalid standout direction for ${standout.dimension}: ${standout.direction}`);
}

export function drawShareCard(
  context: ShareCanvasContext,
  result: FacetResult,
  scale = 1,
): void {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Share-card scale must be a positive number');
  }

  const weather = WEATHER_COPY[result.weather.code];
  const primaryCopy = getLegacyArchetypeCopy(result.primary.code);
  const adjacentCopy = getLegacyArchetypeCopy(result.adjacent.code);
  const title = result.clarity === 'free'
    ? 'FREE · 自由切面'
    : `${result.primary.code} · ${primaryCopy.name}`;

  context.save();
  context.scale(scale, scale);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  context.fillStyle = '#F4F0E8';
  context.fillRect(0, 0, 1080, 1440);
  context.fillStyle = '#20221F';
  context.fillRect(0, 0, 1080, 900);

  context.fillStyle = '#C9F66F';
  context.font = '700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.fillText('FACET / FCT', 88, 112);

  context.fillStyle = '#F8F5EF';
  context.font = '700 76px STSong, Songti SC, SimSun, serif';
  drawWrappedText(context, title, 88, 260, 904, 94, 3);

  if (result.clarity === 'free') {
    context.font = '600 36px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
    context.fillText(`最近参考：${result.primary.code} · ${primaryCopy.name}`, 88, 456);
  }

  context.fillStyle = '#F4553D';
  context.font = '700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.fillText(`${result.weather.code} · ${weather.name}${result.weather.isBoundary ? ' / 交界' : ''}`, 88, 570);

  context.fillStyle = '#F8F5EF';
  context.font = '500 40px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
  const afterStandout = drawWrappedText(context, `突出切面：${standoutText(result.standout)}`, 88, 690, 904, 58, 3);

  context.fillStyle = '#D5CFC4';
  context.font = '500 31px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
  context.fillText(`相邻切面：${result.adjacent.code} · ${adjacentCopy.name}`, 88, afterStandout + 46);

  drawTransitLine(context);

  context.fillStyle = '#171716';
  context.font = '700 30px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.fillText('32 SCENES / 6 CORE LINES / 2 WEATHER SIGNALS', 88, 1268);
  context.font = '500 28px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
  context.fillText('娱乐向自我观察，不用于诊断、招聘或重大决策。', 88, 1350);
  context.restore();
}
