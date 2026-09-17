export type ResourceRowRange = {
  resourceId: string;
  startRow: number;
  rowCount: number;
};

type RowCountedResource = {
  resourceId: string;
  visibleRowsCount: number;
};

/**
 * Maps each resource to the band of rows that its tiles occupy.
 *
 * @param visibleLayoutsPerResource Layouts in the order that they are drawn.
 * @returns One range for each resource, in the same order.
 */
export const getResourceRowRanges = (
  visibleLayoutsPerResource: readonly RowCountedResource[]
): ResourceRowRange[] => {
  let startRow = 0;

  return visibleLayoutsPerResource.map((layout) => {
    const range = { resourceId: layout.resourceId, startRow, rowCount: layout.visibleRowsCount };
    startRow += layout.visibleRowsCount;

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
