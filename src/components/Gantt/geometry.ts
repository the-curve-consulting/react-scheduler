import dayjs from "dayjs";
import { boxHeight } from "@/constants";
import { getCellWidth, getTilePositionRelativeToCenter } from "@/utils/scrollHelpers";
import { GanttLinkKind } from "@/types/gantt";

/**
 * Where a bar sits on the canvas.
 *
 * Rows reuse the Scheduler's `boxHeight` so the shared grid canvas
 * (drawYearlyView and friends) needs no changes and cannot regress for
 * <Scheduler>. A denser Gantt row would mean parameterising row height through
 * all three canvas painters, which is a separate change.
 */
export const ganttBarHeight = 22;
export const ganttBarTop = (boxHeight - ganttBarHeight) / 2;
/** Half the width of a milestone diamond. */
export const milestoneRadius = 8;

export type BarGeometry = {
  x: number;
  y: number;
  width: number;
  /** Vertical centre of the row, which is where links attach. */
  centerY: number;
};

/**
 * Converts a task's dates into pixels for the current viewport.
 *
 * Mirrors getTileProperties: the start snaps to the beginning of its day and
 * the end to the end of its day, so a one-day task fills exactly one daily
 * cell rather than collapsing to nothing.
 */
export const getBarGeometry = (
  rowIndex: number,
  startDate: Date,
  endDate: Date,
  currentCenterDate: dayjs.Dayjs,
  zoom: number,
  cols: number
): BarGeometry => {
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).endOf("day");
  const cellWidth = getCellWidth(zoom);
  const x = getTilePositionRelativeToCenter(start, currentCenterDate, zoom, cols);

  let cells: number;
  switch (zoom) {
    case 0:
      cells = Math.ceil(end.diff(start, "days", true)) / 7;
      break;
    case 1:
      cells = Math.ceil(end.diff(start, "days", true));
      break;
    case 2:
      cells = end.diff(start, "hours");
      break;
    default:
      cells = Math.ceil(end.diff(start, "days", true));
  }

  return {
    x,
    y: rowIndex * boxHeight + ganttBarTop,
    width: Math.max(cells * cellWidth, 1),
    centerY: rowIndex * boxHeight + boxHeight / 2
  };
};

/** Pixels per day at the current zoom — what a drag of N pixels is worth. */
export const getPixelsPerDay = (zoom: number): number => {
  switch (zoom) {
    case 0:
      return getCellWidth(0) / 7;
    case 2:
      return getCellWidth(2) * 24;
    default:
      return getCellWidth(1);
  }
};

const ARROW_STUB = 12;
const ARROW_CLEARANCE = 14;

/**
 * An orthogonal path from one bar's edge to another's, in the shape a Gantt
 * reader expects: leave the predecessor horizontally, turn once, and arrive at
 * the successor horizontally.
 *
 * When the successor starts before the predecessor ends — a link the plan
 * allows but the eye does not — the path routes around the rows rather than
 * doubling back through them.
 */
export const getLinkPath = (from: BarGeometry, to: BarGeometry, kind: GanttLinkKind): string => {
  const fromStart = kind === "start_to_start" || kind === "start_to_finish";
  const toFinish = kind === "finish_to_finish" || kind === "start_to_finish";

  // Which edge the arrow leaves, and which it arrives at.
  const startX = fromStart ? from.x : from.x + from.width;
  const endX = toFinish ? to.x + to.width : to.x;
  const startY = from.centerY;
  const endY = to.centerY;

  // The direction the arrowhead points, so the approach stub is on the right
  // side of the target.
  const approach = toFinish ? 1 : -1;
  const departure = fromStart ? -1 : 1;

  const departX = startX + departure * ARROW_STUB;
  const arriveX = endX + approach * ARROW_STUB;

  // The simple case: there is room to turn once between the two edges.
  const hasRoom = departure === 1 ? arriveX >= departX : arriveX <= departX;
  if (hasRoom) {
    const turnX = (departX + arriveX) / 2;
    return `M ${startX} ${startY} H ${turnX} V ${endY} H ${endX}`;
  }

  // Otherwise drop into the gutter between the two rows and come back.
  const gutterY = endY + (endY > startY ? -1 : 1) * (boxHeight / 2 - ARROW_CLEARANCE / 2);
  return [
    `M ${startX} ${startY}`,
    `H ${departX}`,
    `V ${gutterY}`,
    `H ${arriveX}`,
    `V ${endY}`,
    `H ${endX}`
  ].join(" ");
};

/** The arrowhead, drawn at the target edge pointing the way the path arrives. */
export const getArrowHead = (to: BarGeometry, kind: GanttLinkKind): string => {
  const toFinish = kind === "finish_to_finish" || kind === "start_to_finish";
  const tipX = toFinish ? to.x + to.width : to.x;
  const direction = toFinish ? 1 : -1;
  const tailX = tipX + direction * 6;

  return `M ${tipX} ${to.centerY} L ${tailX} ${to.centerY - 4} L ${tailX} ${to.centerY + 4} Z`;
};
