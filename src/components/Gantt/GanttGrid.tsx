import { useCallback, useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import { useTheme } from "styled-components";
import {
  boxHeight,
  canvasId,
  canvasWrapperId,
  gridInnerWrapperId,
  outsideWrapperId
} from "@/constants";
import { useCalendar } from "@/context/CalendarProvider";
import { drawGrid } from "@/utils/drawGrid/drawGrid";
import { resizeCanvas } from "@/utils/resizeCanvas";
import { getScrollConfig } from "@/utils/scrollHelpers";
import { GanttLink, GanttRow, GanttTask, GanttTaskChange } from "@/types/gantt";
import GanttBars from "./GanttBars/GanttBars";
import GanttLinks from "./GanttLinks/GanttLinks";
import GanttToday from "./GanttToday/GanttToday";
import { StyledCanvas, StyledGridInnerWrapper, StyledGridWrapper } from "./styles";

export type GanttGridProps<TMeta = unknown> = {
  rows: Array<GanttRow<TMeta>>;
  links: Array<GanttLink>;
  outlineWidth: number;
  editable: boolean;
  showLinks: boolean;
  showBaselines: boolean;
  showToday: boolean;
  todayLabel: string;
  onTaskClick?: (task: GanttTask<TMeta>) => void;
  onTaskChange?: (change: GanttTaskChange, task: GanttTask<TMeta>) => void;
};

/**
 * The chart body: the shared grid canvas with the bar and link layers on top.
 *
 * It mirrors <Grid> rather than reusing it, because Grid renders <Tiles> and
 * takes the Scheduler's occupancy data. Sharing the canvas painters but not the
 * content layer is the whole point of the split — drawGrid is untouched, so
 * <Scheduler> cannot regress.
 */
export const GanttGrid = <TMeta,>({
  rows,
  links,
  outlineWidth,
  editable,
  showLinks,
  showBaselines,
  showToday,
  todayLabel,
  onTaskClick,
  onTaskChange
}: GanttGridProps<TMeta>) => {
  const { handleScrollChange, visibleRange, zoom, viewportWidth, cols, currentCenterDate } =
    useCalendar<TMeta>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScrollLeft = useRef(0);
  const theme = useTheme();

  const scrollConfig = useMemo(() => getScrollConfig(zoom), [zoom]);
  // One spare row so the last bar is not flush against the bottom edge.
  const rowCount = Math.max(rows.length + 1, 1);
  const height = rowCount * boxHeight + 1;

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (viewportWidth === 0) return;
      resizeCanvas(ctx, viewportWidth, height);
      drawGrid(ctx, zoom, rowCount, cols, currentCenterDate as dayjs.Dayjs, theme);
    },
    [cols, currentCenterDate, height, rowCount, theme, viewportWidth, zoom]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    paint(ctx);
  }, [paint, visibleRange]);

  useEffect(() => {
    const container = document.getElementById(outsideWrapperId);
    if (!container) return;

    let ticking = false;
    const onScroll = (event: Event) => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const target = event.target as HTMLElement;
        if (target.scrollLeft !== lastScrollLeft.current) {
          lastScrollLeft.current = target.scrollLeft;
          handleScrollChange(target.scrollLeft);
        }
        ticking = false;
      });
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [handleScrollChange]);

  return (
    <StyledGridWrapper id={canvasWrapperId} $virtualWidth={scrollConfig.containerWidth}>
      <StyledGridInnerWrapper
        id={gridInnerWrapperId}
        $viewportWidth={viewportWidth}
        $offset={outlineWidth}>
        <StyledCanvas id={canvasId} ref={canvasRef} />
        {showToday && (
          <GanttToday
            currentCenterDate={currentCenterDate}
            zoom={zoom}
            cols={cols}
            height={height}
            width={scrollConfig.containerWidth}
            label={todayLabel}
          />
        )}
        {showLinks && links.length > 0 && (
          <GanttLinks
            rows={rows}
            links={links}
            currentCenterDate={currentCenterDate}
            zoom={zoom}
            cols={cols}
            width={viewportWidth}
            height={height}
          />
        )}
        <GanttBars
          rows={rows}
          currentCenterDate={currentCenterDate}
          zoom={zoom}
          cols={cols}
          editable={editable}
          showBaselines={showBaselines}
          onTaskClick={onTaskClick}
          onTaskChange={onTaskChange}
        />
      </StyledGridInnerWrapper>
    </StyledGridWrapper>
  );
};

export default GanttGrid;
