export const LIQUOR_BOTTLE_SIZES_ML = [2000, 1000, 750, 500, 375, 180, 90, 60] as const;
export type LiquorBottleSize = typeof LIQUOR_BOTTLE_SIZES_ML[number];

export const PEG_ML = { small: 30, large: 60 } as const;
export type PegSize = keyof typeof PEG_ML;

export function isValidLiquorBottleSizeCatalog(ml: number): ml is LiquorBottleSize {
  return (LIQUOR_BOTTLE_SIZES_ML as readonly number[]).includes(ml);
}

export function pegsInBottle(bottleMl: number, pegMl: number) {
  if (!isValidLiquorBottleSizeCatalog(bottleMl)) throw new Error(`Unregulated bottle size: ${bottleMl}`);
  if (![30, 60].includes(pegMl)) throw new Error(`Unsupported peg: ${pegMl}`);
  return { whole: Math.floor(bottleMl / pegMl), remainderMl: bottleMl % pegMl };
}
