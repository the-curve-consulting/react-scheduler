export type ResourceRowRange = {
  id: string;
  startRow: number;
  rowCount: number;
};

type RowWithSubRows = {
  id: string;
  data: readonly unknown[];
};

/**
 * Maps each resource to the band of rows that its tiles occupy.
 *
 * A resource with no tiles still occupies one row, so the grid keeps a line
 * for it.
 *
 * @param data Rows of the scheduler, in the order that they are drawn.
 * @returns One range for each resource, in the same order.
 */
export const getResourceRowRanges = (data: readonly RowWithSubRows[]): ResourceRowRange[] => {
  let startRow = 0;

  return data.map((resource) => {
    const rowCount = Math.max(resource.data.length, 1);
    const range = { id: resource.id, startRow, rowCount };
    startRow += rowCount;

    return range;
  });
};

/**
 * Finds the resource that owns a row.
 *
 * @param ranges Ranges from getResourceRowRanges.
 * @param row Index of the row, counted from the top of the grid.
 * @returns The range that contains the row, or undefined below the last one.
 */
export const getResourceRangeAtRow = (
  ranges: readonly ResourceRowRange[],
  row: number
): ResourceRowRange | undefined =>
  ranges.find((range) => row >= range.startRow && row < range.startRow + range.rowCount);
