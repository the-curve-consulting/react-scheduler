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
  canvasId,
  canvasWrapperId,
  gridInnerWrapperId,
  leftColumnWidth,
  outsideWrapperId,
  tileYOffset
} from "@/constants";
import { Loader, Tiles } from "@/components";
import { useCalendar } from "@/context/CalendarProvider";
import { resizeCanvas } from "@/utils/resizeCanvas";
import { getCellDateRelativeToCenter, getCellWidth, getScrollConfig } from "@/utils/scrollHelpers";
import { getResourceRangeAtRow, getResourceRowRanges } from "@/utils/getResourceRowRanges";
import { SchedulerProjectData, SchedulerTileChange } from "@/types/global";
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

/** A drag of a tile, in whole days from where the pointer went down. */
export type TileGesture = {
  /** groupId of the tiles being dragged, so every part of one booking moves. */
  groupId: string;
  reason: SchedulerTileChange["reason"];
  days: number;
};

/** A drag over empty days, from the cell it started on to the cell now under the pointer. */
type EmptySelection = {
  anchor: EmptyCell;
  head: EmptyCell;
};

const selectionBounds = (selection: EmptySelection) => {
  const { anchor, head } = selection;
  const startDate = head.date.isBefore(anchor.date) ? head.date : anchor.date;
  const endDate = head.date.isBefore(anchor.date) ? anchor.date : head.date;

  return {
    startDate,
    endDate,
    left: Math.min(anchor.left, head.left),
    width: Math.abs(head.left - anchor.left) + anchor.width,
    top: anchor.top
  };
};

const GridInner = <TMeta,>(
  {
    visibleLayoutsPerResource,
    rows,
    onTileClick,
    onHolidayTileClick,
    onEmptyClick,
    onTileChange
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
    currentCenterDate
  } = useCalendar<TMeta>();

  const scrollConfig = useMemo(() => getScrollConfig(zoom), [zoom]);
  const rowRanges = useMemo(
    () => getResourceRowRanges(visibleLayoutsPerResource),
    [visibleLayoutsPerResource]
  );
  const [hoveredCell, setHoveredCell] = useState<EmptyCell | null>(null);
  const [emptySelection, setEmptySelection] = useState<EmptySelection | null>(null);
  const [tileGesture, setTileGesture] = useState<TileGesture | null>(null);
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
        resourceId: range.resourceId,
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
      if (tileGesture) return;
      const cell = resolveEmptyCell(event);

      // A drag stays on the row it started on, because a block belongs to one
      // resource. Only the day under the pointer moves the selection.
      setEmptySelection((previous) => {
        if (!previous || !cell || cell.resourceId !== previous.anchor.resourceId) return previous;
        if (cell.left === previous.head.left) return previous;
        return { ...previous, head: cell };
      });

      setHoveredCell((previous) => {
        if (!cell) return previous === null ? previous : null;
        if (previous && previous.left === cell.left && previous.top === cell.top) return previous;
        return cell;
      });
    },
    [resolveEmptyCell, tileGesture]
  );

  const handleGridMouseLeave = useCallback(() => setHoveredCell(null), []);

  const handleGridPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const cell = resolveEmptyCell(event);
      if (!cell) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      setEmptySelection({ anchor: cell, head: cell });
    },
    [resolveEmptyCell]
  );

  const handleGridPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!emptySelection) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const { startDate, endDate } = selectionBounds(emptySelection);
      setEmptySelection(null);
      onEmptyClick?.({
        resourceId: emptySelection.anchor.resourceId,
        startDate: startDate.toDate(),
        endDate: endDate.toDate()
      });
    },
    [emptySelection, onEmptyClick]
  );

  const beginTileGesture = useCallback(
    (
      event: React.PointerEvent,
      project: SchedulerProjectData<TMeta>,
      resourceId: string,
      reason: SchedulerTileChange["reason"]
    ) => {
      if (!onTileChange) return;
      // Without this the grid would start an empty-day selection underneath.
      event.stopPropagation();
      event.preventDefault();

      // The preview re-renders the tiles, so the element under the pointer may
      // be replaced part way through. Window listeners outlive it; pointer
      // capture on the element would not.
      const groupId = project.groupId ?? project.id;
      const dayWidth = getCellWidth(zoom);
      const originX = event.clientX;
      // The gesture's own running total. State drives the preview, but the
      // pointerup handler reads this: setState is async, so by the time the
      // drag ends the state it can see may be a frame behind the pointer.
      let latestDays = 0;

      const move = (moveEvent: PointerEvent) => {
        // Snapped to whole days: a drag that lands mid-day is a date the user
        // did not choose and the host would only have to round anyway.
        const days = Math.round((moveEvent.clientX - originX) / dayWidth);
        if (days === latestDays) return;

        latestDays = days;
        setTileGesture({ groupId, reason, days });
      };

      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);
      };

      const finish = () => {
        stop();

        const days = latestDays;
        setTileGesture(null);
        if (days === 0) return;

        // A drag ends with a click on the tile, which would open whatever the
        // host opens on a click. Swallow that one click, and drop the guard on
        // the next tick in case the pointer left the tile and none arrives.
        const swallowClick = (clickEvent: Event) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        window.addEventListener("click", swallowClick, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener("click", swallowClick, true), 0);

        const start = dayjs(project.startDate);
        const end = dayjs(project.endDate);
        const change: SchedulerTileChange = {
          id: project.id,
          groupId,
          resourceId,
          days,
          reason,
          startDate: reason === "resize-end" ? start.toDate() : start.add(days, "day").toDate(),
          endDate: reason === "resize-start" ? end.toDate() : end.add(days, "day").toDate()
        };

        // A resize that would invert the bar is not a shorter block, it is a
        // mis-drag; clamp it to a single day rather than reporting nonsense.
        if (dayjs(change.endDate).isBefore(change.startDate, "day")) {
          if (reason === "resize-start") change.startDate = change.endDate;
          else change.endDate = change.startDate;
        }

        onTileChange(change, project);
      };

      const cancel = () => {
        stop();
        setTileGesture(null);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", cancel);
      setTileGesture({ groupId, reason, days: 0 });
    },
    [onTileChange, zoom]
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
        $dragging={!!emptySelection || !!tileGesture}
        onPointerDown={onEmptyClick && !isBlocking ? handleGridPointerDown : undefined}
        onPointerUp={onEmptyClick && !isBlocking ? handleGridPointerUp : undefined}
        onMouseMove={onEmptyClick && !isBlocking ? handleGridMouseMove : undefined}
        onMouseLeave={onEmptyClick ? handleGridMouseLeave : undefined}
        ref={ref}>
        <Loader isLoading={isLeftLoading} position="left" />
        <StyledCanvas id={canvasId} ref={canvasRef} />
        <StyledTilesLayer $isInteractive={!isBlocking}>
          <Tiles
            visibleLayoutsPerResource={visibleLayoutsPerResource}
            zoom={zoom}
            visibleRange={visibleRange}
            onTileClick={onTileClick}
            onHolidayTileClick={onHolidayTileClick}
            tileGesture={tileGesture}
            onTileGestureStart={onTileChange ? beginTileGesture : undefined}
          />
        </StyledTilesLayer>
        {isBlocking ? (
          <StyledBlockingOverlay>
            <StyledBlockingContent>Loading data...</StyledBlockingContent>
          </StyledBlockingOverlay>
        ) : null}
        {emptySelection && !isBlocking ? (
          <StyledEmptyCellHighlight
            style={{
              left: `${selectionBounds(emptySelection).left}px`,
              top: `${selectionBounds(emptySelection).top}px`,
              width: `${selectionBounds(emptySelection).width}px`
            }}>
            +
          </StyledEmptyCellHighlight>
        ) : hoveredCell && !isBlocking && !tileGesture ? (
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
