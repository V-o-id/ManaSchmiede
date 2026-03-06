export type LayoutMode = "exact_63x88" | "tight_margin";

export interface GridSlotMm {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  row: number;
  col: number;
}

export interface NineUpLayoutMm {
  mode: LayoutMode;
  pageWidthMm: number;
  pageHeightMm: number;
  cardWidthMm: number;
  cardHeightMm: number;
  gapMm: number;
  columns: number;
  rows: number;
  marginXmm: number;
  marginYmm: number;
  slots: GridSlotMm[];
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const COLUMNS = 3;
const ROWS = 3;

export function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

export function createNineUpLayout(mode: LayoutMode): NineUpLayoutMm {
  const settings =
    mode === "tight_margin"
      ? {
          cardWidthMm: 63.5,
          cardHeightMm: 88.5,
          gapMm: 1.0
        }
      : {
          cardWidthMm: 63,
          cardHeightMm: 88,
          gapMm: 1.5
        };

  const usedWidthMm = settings.cardWidthMm * COLUMNS + settings.gapMm * (COLUMNS - 1);
  const usedHeightMm = settings.cardHeightMm * ROWS + settings.gapMm * (ROWS - 1);
  const marginXmm = (A4_WIDTH_MM - usedWidthMm) / 2;
  const marginYmm = (A4_HEIGHT_MM - usedHeightMm) / 2;

  const slots: GridSlotMm[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLUMNS; col += 1) {
      const xMm = marginXmm + col * (settings.cardWidthMm + settings.gapMm);
      const yMm = marginYmm + row * (settings.cardHeightMm + settings.gapMm);
      slots.push({
        xMm,
        yMm,
        widthMm: settings.cardWidthMm,
        heightMm: settings.cardHeightMm,
        row,
        col
      });
    }
  }

  return {
    mode,
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm: A4_HEIGHT_MM,
    cardWidthMm: settings.cardWidthMm,
    cardHeightMm: settings.cardHeightMm,
    gapMm: settings.gapMm,
    columns: COLUMNS,
    rows: ROWS,
    marginXmm,
    marginYmm,
    slots
  };
}

