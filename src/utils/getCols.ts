import {
  weekWidth,
  dayWidth,
  outsideWrapperId,
  leftColumnWidth as defaultLeftColumnWidth,
  zoom2ColumnWidth
} from "@/constants";

/**
 * How many timeline columns fit beside the left column.
 *
 * `leftColumnWidth` defaults to the Scheduler's own, and <Gantt> passes its
 * outline width — which may be 0 when the host renders its own task grid. It
 * has to agree with the width the canvas is painted at, or the grid runs out
 * before the right-hand edge and bars sit on blank background.
 */
export const getCols = (zoom: number, leftColumnWidth = defaultLeftColumnWidth) => {
  const wrapperWidth = document.getElementById(outsideWrapperId)?.clientWidth || 0;
  const componentWidth = wrapperWidth - leftColumnWidth;

  // Returns the number of visible columns that fit in the viewport
  switch (zoom) {
    case 1:
      return Math.ceil(componentWidth / dayWidth);
    case 2:
      return Math.ceil(componentWidth / zoom2ColumnWidth);
    default:
      return Math.ceil(componentWidth / weekWidth);
  }
};
