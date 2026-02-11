import { FC, useCallback, useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import {
  headerHeight,
  canvasHeaderWrapperId,
  zoom2HeaderHeight,
  leftColumnWidth
} from "@/constants";
import { useCalendar } from "@/context/CalendarProvider";
import { useLanguage } from "@/context/LocaleProvider";
import { drawHeader } from "@/utils/drawHeader/drawHeader";
import { resizeCanvas } from "@/utils/resizeCanvas";
import { HeaderProps } from "./types";
import { StyledCanvas, StyledOuterWrapper, StyledWrapper } from "./styles";
import Topbar from "./Topbar";

const Header: FC<HeaderProps> = ({ zoom, topBarWidth, showThemeToggle, toggleTheme }) => {
  const { week } = useLanguage();
  const { cols, dayOfYear, startDate, currentCenterDate, viewportWidth } = useCalendar();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme = useTheme();

  const handleResize = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Don't draw if viewport width is not initialized yet
      if (viewportWidth === 0) return;

      // Header canvas width must match Grid canvas width (viewport width)
      const width = viewportWidth;
      const currentHeaderHeight = zoom === 2 ? zoom2HeaderHeight : headerHeight;
      const height = currentHeaderHeight + 1;
      resizeCanvas(ctx, width, height);

      drawHeader(ctx, zoom, cols, startDate, currentCenterDate, week, dayOfYear, theme);
    },
    [cols, dayOfYear, startDate, currentCenterDate, week, zoom, theme, viewportWidth]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const onResize = () => handleResize(ctx);
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.letterSpacing = "1px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    handleResize(ctx);
  }, [zoom, handleResize, viewportWidth]);

  return (
    <StyledOuterWrapper>
      <Topbar width={topBarWidth} showThemeToggle={showThemeToggle} toggleTheme={toggleTheme} />
      <StyledWrapper
        id={canvasHeaderWrapperId}
        $viewportWidth={viewportWidth}
        $leftColumnWidth={leftColumnWidth}>
        <StyledCanvas ref={canvasRef} />
      </StyledWrapper>
    </StyledOuterWrapper>
  );
};

export default Header;
