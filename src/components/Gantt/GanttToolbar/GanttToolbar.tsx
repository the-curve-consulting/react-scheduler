import dayjs from "dayjs";
import { useCalendar } from "@/context/CalendarProvider";
import { ZoomLevel } from "@/types/global";
import {
  StyledGroup,
  StyledNavButton,
  StyledRange,
  StyledSegment,
  StyledSegmentedControl,
  StyledSpacer,
  StyledThemeButton,
  StyledToolbar,
  StyledTodayButton
} from "./styles";

const ZOOM_OPTIONS: Array<{ level: ZoomLevel; label: string }> = [
  { level: 0, label: "Weeks" },
  { level: 1, label: "Days" },
  { level: 2, label: "Hours" }
];

/**
 * The chart's own controls.
 *
 * <Scheduler>'s topbar is left exactly as it is; this is a separate component
 * rather than a restyle of it, so nothing here can reach the existing consumer.
 *
 * The differences are deliberate. Zoom is a named segmented control rather than
 * a `-`/`+` pair, because "View +" does not tell you whether you are about to
 * see weeks or hours. The visible month is shown as a label, so the toolbar
 * says where you are as well as offering to move you. And the whole thing is
 * quiet — an application's own chrome should be the loudest thing on screen.
 */
export const GanttToolbar = ({
  width,
  showThemeToggle,
  onToggleTheme,
  isDark
}: {
  /** Visible width of the scroll container, so the bar can be pinned to it. */
  width: number;
  showThemeToggle?: boolean;
  onToggleTheme?: () => void;
  isDark?: boolean;
}) => {
  const { handleGoNext, handleGoPrev, handleGoToday, zoom, setZoomLevel, visibleRange } =
    useCalendar();

  const start = dayjs(visibleRange.startDate);
  const end = dayjs(visibleRange.endDate);
  // "August 2026", or "Aug - Oct 2026" when the window straddles months.
  const range =
    start.isSame(end, "month") || !end.isValid()
      ? start.format("MMMM YYYY")
      : `${start.format("MMM")} - ${end.format("MMM YYYY")}`;

  return (
    <StyledToolbar $width={width}>
      <StyledGroup>
        <StyledNavButton type="button" onClick={handleGoPrev} aria-label="Previous">
          <Chevron direction="left" />
        </StyledNavButton>
        <StyledTodayButton type="button" onClick={handleGoToday}>
          Today
        </StyledTodayButton>
        <StyledNavButton type="button" onClick={handleGoNext} aria-label="Next">
          <Chevron direction="right" />
        </StyledNavButton>
      </StyledGroup>

      <StyledRange>{range}</StyledRange>

      <StyledSpacer />

      <StyledSegmentedControl role="group" aria-label="Zoom">
        {ZOOM_OPTIONS.map((option) => (
          <StyledSegment
            key={option.level}
            type="button"
            $active={zoom === option.level}
            aria-pressed={zoom === option.level}
            onClick={() => setZoomLevel(option.level)}>
            {option.label}
          </StyledSegment>
        ))}
      </StyledSegmentedControl>

      {showThemeToggle && (
        <StyledThemeButton
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>
          {isDark ? "☾" : "☀"}
        </StyledThemeButton>
      )}
    </StyledToolbar>
  );
};

const Chevron = ({ direction }: { direction: "left" | "right" }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d={direction === "left" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default GanttToolbar;
