import { Scheduler } from "./components";
import "./styles.css";
export type {
  FetchDataParams,
  SchedulerAsyncProps,
  SchedulerProps,
  SchedulerStaticProps
} from "./components/Scheduler/types";
export type { ParsedDatesRange } from "./utils/getDatesRange";
export type {
  Config,
  SchedulerData,
  SchedulerItemClickData,
  SchedulerProjectData,
  ZoomLevel
} from "./types/global";

export { Scheduler };
