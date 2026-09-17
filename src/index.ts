import { Gantt, Scheduler } from "./components";
import "./styles.css";
export type {
  FetchDataParams,
  ProjectDeleteUpdate,
  ProjectUpdate,
  SchedulerAsyncProps,
  SchedulerHandle,
  SchedulerProps,
  SchedulerStaticProps
} from "./components/Scheduler/types";
export type { GanttProps } from "./components/Gantt/Gantt";
export { useGanttRows } from "./components/Gantt/useGanttRows";
export type { ParsedDatesRange } from "./utils/getDatesRange";
export type {
  Config,
  SchedulerData,
  SchedulerRow,
  SchedulerItemClickData,
  SchedulerEmptyClickData,
  SchedulerTileChange,
  SchedulerProjectData,
  ZoomLevel,
  HolidayRequest,
  HolidayTileClickData,
  HeaderFonts,
  SchedulerToolbar,
  TileStyle
} from "./types/global";
export type {
  GanttConfig,
  GanttData,
  GanttLink,
  GanttLinkKind,
  GanttRow,
  GanttTask,
  GanttTaskChange,
  GanttTaskKind
} from "./types/gantt";

export { Gantt, Scheduler };
