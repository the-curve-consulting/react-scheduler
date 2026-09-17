import {
  ForwardedRef,
  forwardRef,
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import dayjs from "dayjs";
import { useTheme } from "styled-components";
import { drawGrid } from "@/utils/drawGrid/drawGrid";
import {
  boxHeight,
  businessDays,
  canvasId,
  canvasWrapperId,
  dayStartHour,
  gridInnerWrapperId,
  leftColumnWidth,
  maxHoursPerWeek,
  outsideWrapperId,
  tileYOffset
} from "@/constants";
import { Loader, Tiles } from "@/components";
import { useCalendar } from "@/context/CalendarProvider";
import { resizeCanvas } from "@/utils/resizeCanvas";
import { getCellDateRelativeToCenter, getCellWidth, getScrollConfig } from "@/utils/scrollHelpers";
import { getResourceRangeAtRow, getResourceRowRanges } from "@/utils/getResourceRowRanges";
import { GridComponent, GridProps } from "./types";
import {
  StyledBlockingContent,
  StyledBlockingOverlay,
  StyledCanvas,
  StyledEmptyCellHighlight,
  StyledInnerWrapper,
  StyledTilesLayer,
  StyledWrapper
} from "./styles";

type EmptyCell = {
  resourceId: string;
  date: dayjs.Dayjs;
  left: number;
  top: number;
  width: number;
};

const GridInner = <TMeta,>(
  {
    data,
    rows,
    onTileClick,
    onHolidayTileClick,
    onEmptyClick,
    workingDurationsPerPerson
  }: GridProps<TMeta>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const {
    handleScrollChange,
    visibleRange,
    zoom,
    isLoading,
    loadingState,
    viewportWidth,
    cols,
    config,
    currentCenterDate
  } = useCalendar<TMeta>();

  const scrollConfig = useMemo(() => getScrollConfig(zoom), [zoom]);
  const rowRanges = useMemo(() => getResourceRowRanges(data), [data]);
  const [hoveredCell, setHoveredCell] = useState<EmptyCell | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const lastScrollLeft = useRef(0);

  const handleResize = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Don't draw if viewport width is not initialized yet
      if (viewportWidth === 0) return;

      const width = viewportWidth;
      const height = rows * boxHeight + 1;
      resizeCanvas(ctx, width, height);

      // Draw grid for visible range
      drawGrid(ctx, zoom, rows, cols, currentCenterDate, theme);
    },
    [cols, currentCenterDate, rows, zoom, theme, viewportWidth]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    handleResize(ctx);
  }, [visibleRange, rows, zoom, handleResize, viewportWidth]);

  // Scroll listener
  useEffect(() => {
    const container = document.getElementById(outsideWrapperId);
    if (!container) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentScrollLeft = target.scrollLeft;

      //Only trigger if the horizontal position has actually changed
      if (currentScrollLeft !== lastScrollLeft.current) {
        lastScrollLeft.current = currentScrollLeft;
        handleScrollChange(currentScrollLeft);
      }
    };

    // Throttle to 60fps
    let ticking = false;
    const throttledScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", throttledScroll);
    return () => container.removeEventListener("scroll", throttledScroll);
  }, [handleScrollChange]);

  const resolveEmptyCell = useCallback(
    (event: MouseEvent<HTMLDivElement>): EmptyCell | null => {
      if (!onEmptyClick) return null;
      // Every tile is a button, so a target inside one is not empty space.
      if ((event.target as HTMLElement).closest("button")) return null;

      const bounds = event.currentTarget.getBoundingClientRect();
      const row = Math.floor((event.clientY - bounds.top) / boxHeight);
      const range = getResourceRangeAtRow(rowRanges, row);
      if (!range) return null;

      const positionX = event.clientX - bounds.left;
      const { alignedPos, cellDate } = getCellDateRelativeToCenter(
        positionX,
        currentCenterDate,
        zoom,
        cols
      );

      return {
        resourceId: range.id,
        date: cellDate,
        left: alignedPos,
        top: row * boxHeight + tileYOffset,
        width: getCellWidth(zoom)
      };
    },
    [cols, currentCenterDate, onEmptyClick, rowRanges, zoom]
  );

  const handleGridMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const cell = resolveEmptyCell(event);

      setHoveredCell((previous) => {
        if (!cell) return previous === null ? previous : null;
        if (previous && previous.left === cell.left && previous.top === cell.top) return previous;
        return cell;
      });
    },
    [resolveEmptyCell]
  );

  const handleGridMouseLeave = useCallback(() => setHoveredCell(null), []);

  const handleGridClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const cell = resolveEmptyCell(event);
      if (!cell) return;

      onEmptyClick?.({ resourceId: cell.resourceId, date: cell.date.toDate() });
    },
    [onEmptyClick, resolveEmptyCell]
  );

  const isLeftLoading = isLoading || loadingState.blocking || loadingState.backward;
  const isRightLoading = isLoading || loadingState.blocking || loadingState.forward;
  const isBlocking = isLoading || loadingState.blocking;

  return (
    <StyledWrapper id={canvasWrapperId} $virtualWidth={scrollConfig.containerWidth}>
      <StyledInnerWrapper
        id={gridInnerWrapperId}
        $viewportWidth={viewportWidth}
        $leftColumnWidth={leftColumnWidth}
        $clickableEmptyCells={!!onEmptyClick && !isBlocking}
        onClick={onEmptyClick && !isBlocking ? handleGridClick : undefined}
        onMouseMove={onEmptyClick && !isBlocking ? handleGridMouseMove : undefined}
        onMouseLeave={onEmptyClick ? handleGridMouseLeave : undefined}
        ref={ref}>
        <Loader isLoading={isLeftLoading} position="left" />
        <StyledCanvas id={canvasId} ref={canvasRef} />
        <StyledTilesLayer $isInteractive={!isBlocking}>
          <Tiles
            data={data}
            zoom={zoom}
            visibleRange={visibleRange}
            onTileClick={onTileClick}
            onHolidayTileClick={onHolidayTileClick}
            workingDurationsPerPerson={workingDurationsPerPerson}
            defaultStartHour={config.defaultStartHour ?? dayStartHour}
            defaultWorkDayHours={(config.maxHoursPerWeek ?? maxHoursPerWeek) / businessDays}
          />
        </StyledTilesLayer>
        {isBlocking ? (
          <StyledBlockingOverlay>
            <StyledBlockingContent>Loading data...</StyledBlockingContent>
          </StyledBlockingOverlay>
        ) : null}
        {hoveredCell && !isBlocking ? (
          <StyledEmptyCellHighlight
            style={{
              left: `${hoveredCell.left}px`,
              top: `${hoveredCell.top}px`,
              width: `${hoveredCell.width}px`
            }}>
            +
          </StyledEmptyCellHighlight>
        ) : null}
        <Loader isLoading={isRightLoading} position="right" />
      </StyledInnerWrapper>
    </StyledWrapper>
  );
};

const GridBase = forwardRef(GridInner) as GridComponent;
const Grid = memo(GridBase) as GridComponent;

export default Grid;
