import type { LocaleCatalog } from '../i18n/types';
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
  locale: LocaleCatalog['meta']['locale'],
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const lines: string[] = [];
  if (text.length === 0) {
    return y;
  }

  if (locale === 'en') {
    const tokenRegex = /\S+\s*/g;
    const tokens = text.match(tokenRegex) ?? [];
    let current = '';
    const splitToken = (token: string): string[] => {
      const splitLines: string[] = [];
      let buffer = '';
      for (const character of [...token]) {
        const candidate = buffer + character;
        if (buffer !== '' && context.measureText(candidate).width > maxWidth) {
          splitLines.push(buffer);
          buffer = character;
        } else {
          buffer = candidate;
        }
      }
      if (buffer !== '') {
        splitLines.push(buffer);
      }
      return splitLines;
    };

    for (const token of tokens) {
      const candidate = current + token;
      if (context.measureText(candidate).width > maxWidth) {
        if (current !== '') {
          lines.push(current);
          current = '';
        }
        if (context.measureText(token).width > maxWidth) {
          const fallbackTokens = splitToken(token);
          for (const fallback of fallbackTokens.slice(0, -1)) {
            lines.push(fallback);
          }
          current = fallbackTokens.length === 0 ? '' : fallbackTokens[fallbackTokens.length - 1] ?? '';
        } else {
          current = token;
        }
      } else {
        current = candidate;
      }
    }
    if (current !== '') {
      lines.push(current);
    }
  } else {
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

function standoutText(result: FacetResult, copy: LocaleCatalog): string {
  if (result.standout.dimension === 'BALANCED') {
    return copy.result.balancedStandout;
  }

  const dimensionCopy = copy.dimensions[result.standout.dimension];
  if (result.standout.direction === 'low') {
    return dimensionCopy.lowLabel;
  }
  if (result.standout.direction === 'high') {
    return dimensionCopy.highLabel;
  }
  throw new Error(`Invalid standout direction for ${result.standout.dimension}: ${result.standout.direction}`);
}

function drawTitle(context: ShareCanvasContext, result: FacetResult, copy: LocaleCatalog, x: number, y: number): void {
  const weather = copy.weather[result.weather.code];
  const primaryCopy = copy.archetypes[result.primary.code];
  const title = result.clarity === 'free'
    ? copy.result.freeFacet
    : `${result.primary.code} · ${primaryCopy.name}`;
  const headingFont = copy.meta.locale === 'zh-CN'
    ? '700 76px STSong, Songti SC, SimSun, serif'
    : '700 76px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
  context.font = headingFont;
  drawWrappedText(context, copy.meta.locale, title, x, y, 904, 94, 3);

  if (result.clarity === 'free') {
    const detailFont = '600 36px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
    context.font = detailFont;
    context.fillText(`${copy.share.recentReference}：${result.primary.code} · ${primaryCopy.name}`, x, 456);
  }

  context.fillStyle = '#F4553D';
  context.font = '700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const boundaryLabel = result.weather.isBoundary ? ` / ${copy.share.boundary}` : '';
  context.fillText(`${result.weather.code} · ${weather.name}${boundaryLabel}`, x, 570);
}

function drawTextBlocks(context: ShareCanvasContext, result: FacetResult, copy: LocaleCatalog, x: number): void {
  const adjacentCopy = copy.archetypes[result.adjacent.code];
  const titleFont = copy.meta.locale === 'zh-CN'
    ? '500 40px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif'
    : '500 40px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  context.fillStyle = '#F8F5EF';
  context.font = titleFont;
  const afterStandout = drawWrappedText(
    context,
    copy.meta.locale,
    `${copy.share.standout}：${standoutText(result, copy)}`,
    x,
    690,
    904,
    58,
    3,
  );

  context.fillStyle = '#D5CFC4';
  context.font = '500 31px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  context.fillText(`${copy.share.adjacent}：${result.adjacent.code} · ${adjacentCopy.name}`, x, afterStandout + 46);

  context.fillStyle = '#F8F5EF';
  context.font = copy.meta.locale === 'zh-CN'
    ? '500 30px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif'
    : '500 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  const operatingFont = copy.meta.locale === 'en'
    ? '500 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    : '500 36px -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif';
  context.font = operatingFont;
  drawWrappedText(context, copy.meta.locale, copy.result.operatingNotes, x, afterStandout + 132, 904, 58, 3);
}

function drawFootnotes(context: ShareCanvasContext, copy: LocaleCatalog, x: number): void {
  context.fillStyle = '#171716';
  context.font = '700 30px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.fillText(copy.share.facts, x, 1268);
  context.font = '500 28px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  context.fillText(copy.share.disclaimer, x, 1350);
}

export function drawShareCard(
  context: ShareCanvasContext,
  result: FacetResult,
  copy: LocaleCatalog,
  scale = 1,
): void {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Share-card scale must be a positive number');
  }

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
  context.fillText(copy.share.brand, 88, 112);

  drawTitle(context, result, copy, 88, 260);
  drawTextBlocks(context, result, copy, 88);

  drawTransitLine(context);
  drawFootnotes(context, copy, 88);
  context.restore();
}
