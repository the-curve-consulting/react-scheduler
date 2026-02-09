import { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useTheme } from "styled-components";
import { drawGrid } from "@/utils/drawGrid/drawGrid";
import {
  boxHeight,
  canvasId,
  canvasWrapperId,
  gridInnerWrapperId,
  leftColumnWidth,
  outsideWrapperId
} from "@/constants";
import { Loader, Tiles } from "@/components";
import { useCalendar } from "@/context/CalendarProvider";
import { resizeCanvas } from "@/utils/resizeCanvas";
import { getScrollConfig } from "@/utils/scrollHelpers";
import { GridProps } from "./types";
import { StyledCanvas, StyledInnerWrapper, StyledWrapper } from "./styles";

const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid({ rows, data, onTileClick }, ref) {
  const {
    handleScrollChange,
    visibleRange,
    zoom,
    isLoading,
    viewportWidth,
    cols,
    config,
    startDate,
    currentCenterDate
  } = useCalendar();

  const scrollConfig = useMemo(() => getScrollConfig(zoom), [zoom]);
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
      drawGrid(ctx, zoom, rows, cols, startDate, currentCenterDate, theme);
    },
    [cols, startDate, currentCenterDate, rows, zoom, theme, viewportWidth]
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

  return (
    <StyledWrapper id={canvasWrapperId} $virtualWidth={scrollConfig.containerWidth}>
      <StyledInnerWrapper
        id={gridInnerWrapperId}
        $viewportWidth={viewportWidth}
        $leftColumnWidth={leftColumnWidth}
        ref={ref}>
        <Loader isLoading={isLoading} position="left" />
        <StyledCanvas id={canvasId} ref={canvasRef} />
        <Tiles
          data={data}
          zoom={zoom}
          visibleRange={visibleRange}
          onTileClick={onTileClick}
          defaultStartHour={config.defaultStartHour}
        />
        <Loader isLoading={isLoading} position="right" />
      </StyledInnerWrapper>
    </StyledWrapper>
  );
});

export default memo(Grid);
