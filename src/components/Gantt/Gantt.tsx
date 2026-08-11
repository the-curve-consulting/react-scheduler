import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ThemeProvider } from "styled-components";
import CalendarProvider, { useCalendar } from "@/context/CalendarProvider";
import LocaleProvider from "@/context/LocaleProvider";
import { outsideWrapperId } from "@/constants";
import { darkTheme, GlobalStyle, theme } from "@/styles";
import {
  GanttConfig,
  GanttData,
  GanttLink,
  GanttRow,
  GanttTask,
  GanttTaskChange
} from "@/types/gantt";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import Header from "../Calendar/Header";
import GanttGrid from "./GanttGrid";
import GanttOutline from "./GanttOutline/GanttOutline";
import { useGanttRows } from "./useGanttRows";
import { StyledChartColumn, StyledEmpty, StyledInnerWrapper, StyledOutsideWrapper } from "./styles";

export type GanttProps<TMeta = unknown> = {
  data: GanttData<TMeta>;
  /** Date to centre the timeline on when it mounts. */
  centerDate?: string | Date;
  config?: GanttConfig;
  /** Blocks interaction and shows the loading treatment. */
  isLoading?: boolean;
  /** Task ids that start collapsed. */
  defaultCollapsed?: Array<string>;
  /** Fires on every scroll, with the dates now on screen. */
  onRangeChange?: (range: ParsedDatesRange) => void;
  onTaskClick?: (task: GanttTask<TMeta>) => void;
  /**
   * A bar was dragged or resized. The component does not move it: apply the
   * change to your own data and pass it back, so whatever rescheduling your
   * plan implies happens in one place rather than two.
   */
  onTaskChange?: (change: GanttTaskChange, task: GanttTask<TMeta>) => void;
  /** Empty-state text. */
  emptyMessage?: string;
  /** Heading above the outline column. */
  outlineLabel?: string;
};

const DEFAULT_OUTLINE_WIDTH = 240;

/**
 * A Gantt chart: a tree of tasks against a timeline, with dependency arrows,
 * milestones, progress and baselines.
 *
 * This is a sibling of <Scheduler>, not a mode of it. They share the calendar
 * provider, the grid and header canvas painters, the zoom and the theming, but
 * their data means different things — <Scheduler> asks how full someone's day
 * is, <Gantt> asks when work happens and what precedes it. Keeping them
 * separate means neither has to carry the other's fields, and changes here
 * cannot reach <Scheduler>.
 */
export const Gantt = <TMeta,>({
  data,
  centerDate,
  config,
  isLoading = false,
  defaultCollapsed,
  onRangeChange,
  onTaskClick,
  onTaskChange,
  emptyMessage = "Nothing to plan yet",
  outlineLabel
}: GanttProps<TMeta>) => {
  const appConfig = useMemo<GanttConfig>(
    () => ({
      zoom: 1,
      filterButtonState: -1,
      showTooltip: false,
      outlineWidth: DEFAULT_OUTLINE_WIDTH,
      editable: true,
      showLinks: true,
      showBaselines: true,
      ...config
    }),
    [config]
  );

  const outlineWidth = appConfig.outlineWidth ?? DEFAULT_OUTLINE_WIDTH;
  const { rows, toggle } = useGanttRows(data.tasks, { defaultCollapsed });

  const outsideWrapperRef = useRef<HTMLDivElement>(null);
  const [topBarWidth, setTopBarWidth] = useState(0);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(appConfig.defaultTheme ?? "light");

  const currentTheme = themeMode === "light" ? theme : darkTheme;
  const mergedTheme = useMemo(
    () => ({
      ...currentTheme,
      colors: {
        ...currentTheme.colors,
        ...(appConfig.theme ? appConfig.theme[currentTheme.mode] : {})
      }
    }),
    [appConfig.theme, currentTheme]
  );

  useEffect(() => {
    const handleResize = () => {
      if (outsideWrapperRef.current) setTopBarWidth(outsideWrapperRef.current.clientWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const centerDateDayJs = useMemo(() => (centerDate ? dayjs(centerDate) : undefined), [centerDate]);

  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={mergedTheme}>
        <LocaleProvider lang={appConfig.lang} translations={appConfig.translations}>
          <CalendarProvider
            isLoading={isLoading}
            config={appConfig}
            leftColumnWidth={outlineWidth}
            onRangeChange={onRangeChange}
            centerDate={centerDateDayJs}>
            <StyledOutsideWrapper id={outsideWrapperId} ref={outsideWrapperRef}>
              <GanttBody
                rows={rows}
                links={data.links ?? []}
                outlineWidth={outlineWidth}
                outlineLabel={outlineLabel}
                topBarWidth={topBarWidth}
                emptyMessage={emptyMessage}
                editable={appConfig.editable ?? true}
                showLinks={appConfig.showLinks ?? true}
                showBaselines={appConfig.showBaselines ?? true}
                showThemeToggle={appConfig.showThemeToggle}
                onToggle={toggle}
                onTaskClick={onTaskClick}
                onTaskChange={onTaskChange}
                onToggleTheme={() => setThemeMode((mode) => (mode === "light" ? "dark" : "light"))}
              />
            </StyledOutsideWrapper>
          </CalendarProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  );
};

type GanttBodyProps<TMeta> = {
  rows: Array<GanttRow<TMeta>>;
  links: Array<GanttLink>;
  outlineWidth: number;
  outlineLabel?: string;
  topBarWidth: number;
  emptyMessage: string;
  editable: boolean;
  showLinks: boolean;
  showBaselines: boolean;
  showThemeToggle?: boolean;
  onToggle: (id: string) => void;
  onTaskClick?: (task: GanttTask<TMeta>) => void;
  onTaskChange?: (change: GanttTaskChange, task: GanttTask<TMeta>) => void;
  onToggleTheme: () => void;
};

/**
 * Everything that lives inside the calendar provider, so the ruler and the bars
 * read zoom from the same place. The provider seeds zoom from config once and
 * then owns it (that is what the View -/+ buttons drive), so reading config
 * out here would leave the header a zoom level behind the chart.
 */
const GanttBody = <TMeta,>({
  rows,
  links,
  outlineWidth,
  outlineLabel,
  topBarWidth,
  emptyMessage,
  editable,
  showLinks,
  showBaselines,
  showThemeToggle,
  onToggle,
  onTaskClick,
  onTaskChange,
  onToggleTheme
}: GanttBodyProps<TMeta>) => {
  const { zoom } = useCalendar();

  return (
    <StyledInnerWrapper>
      {outlineWidth > 0 && (
        <GanttOutline
          rows={rows}
          width={outlineWidth}
          label={outlineLabel}
          onToggle={onToggle}
          onTaskClick={onTaskClick}
        />
      )}
      <StyledChartColumn>
        <Header
          zoom={zoom}
          topBarWidth={topBarWidth}
          leftOffset={outlineWidth}
          showThemeToggle={showThemeToggle}
          toggleTheme={onToggleTheme}
        />
        {rows.length === 0 ? (
          <StyledEmpty>{emptyMessage}</StyledEmpty>
        ) : (
          <GanttGrid
            rows={rows}
            links={links}
            outlineWidth={outlineWidth}
            editable={editable}
            showLinks={showLinks}
            showBaselines={showBaselines}
            onTaskClick={onTaskClick}
            onTaskChange={onTaskChange}
          />
        )}
      </StyledChartColumn>
    </StyledInnerWrapper>
  );
};

export default Gantt;
