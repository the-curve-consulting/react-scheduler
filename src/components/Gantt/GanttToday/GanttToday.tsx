import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getTilePositionRelativeToCenter } from "@/utils/scrollHelpers";
import { StyledTodayLabel, StyledTodayLine } from "./styles";

export type GanttTodayProps = {
  currentCenterDate: dayjs.Dayjs;
  zoom: number;
  cols: number;
  /** Chart body height, so the line runs the full length of the rows. */
  height: number;
  /** Total scrollable width, used only to drop the line when it is off-chart. */
  width: number;
  label: string;
};

/** How often to re-read the clock, so a chart left open overnight is not lying. */
const TICK_MS = 60_000;

/**
 * The "you are here" line.
 *
 * Positioned precisely rather than snapped to the start of the day: at the
 * hourly zoom a line that jumps to midnight would sit a screen's width away
 * from the actual moment.
 */
export const GanttToday = ({
  currentCenterDate,
  zoom,
  cols,
  height,
  width,
  label
}: GanttTodayProps) => {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const x = getTilePositionRelativeToCenter(now, currentCenterDate, zoom, cols, true);

  // A plan that ran last year still scrolls, and the marker would otherwise be
  // drawn thousands of pixels outside the grid, stretching nothing but the DOM.
  if (x < 0 || x > width) return null;

  return (
    <StyledTodayLine $x={x} $height={height}>
      <StyledTodayLabel>{label}</StyledTodayLabel>
    </StyledTodayLine>
  );
};

export default GanttToday;
