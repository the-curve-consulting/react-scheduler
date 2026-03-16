import {
  Config,
  SchedulerData,
  SchedulerFetchLoadingState,
  SchedulerItemClickData,
  SchedulerProjectData
} from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";

export type FetchDataDirection = "backward" | "forward";
export type FetchDataReason = "initial" | "prefetch" | "jump";

export type FetchDataParams = {
  range: ParsedDatesRange;
  direction: FetchDataDirection;
  reason: FetchDataReason;
  signal?: AbortSignal;
};

export type ProjectUpdate = {
  rowId: string;
  projects: SchedulerProjectData[];
};

export type ProjectDeleteUpdate = {
  rowId: string;
  projectIds: string[];
};

export type SchedulerHandle = {
  invalidate: () => void;
  upsertProjects: (updates: ProjectUpdate[]) => void;
  deleteProjects: (updates: ProjectDeleteUpdate[]) => void;
};

export type SchedulerBaseProps = {
  isLoading?: boolean;
  config?: Config;
  startDate?: string;
  dataSourceKey?: string;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onTileClick?: (data: SchedulerProjectData) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
  transformData?: (data: SchedulerData) => SchedulerData;
  onItemClick?: (data: SchedulerItemClickData) => void;
};

export type SchedulerStaticProps = SchedulerBaseProps & {
  data: SchedulerData;
  initialData?: never;
  onFetchData?: never;
};

export type SchedulerAsyncProps = SchedulerBaseProps & {
  onFetchData: (params: FetchDataParams) => Promise<SchedulerData>;
  initialData?: SchedulerData;
  data?: never;
};

export type SchedulerProps = SchedulerStaticProps | SchedulerAsyncProps;

export type StyledOutsideWrapperProps = {
  showScroll: boolean;
};

export const emptySchedulerFetchLoadingState: SchedulerFetchLoadingState = {
  any: false,
  blocking: false,
  forward: false,
  backward: false
};
