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

export type SchedulerProps = {
  data: SchedulerData;
  isLoading?: boolean;
  config?: Config;
  startDate?: string;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onFetchData?: (params: FetchDataParams) => Promise<SchedulerData>;
  onTileClick?: (data: SchedulerProjectData) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
  onItemClick?: (data: SchedulerItemClickData) => void;
};

export type StyledOutsideWrapperProps = {
  showScroll: boolean;
};

export const emptySchedulerFetchLoadingState: SchedulerFetchLoadingState = {
  any: false,
  blocking: false,
  forward: false,
  backward: false
};
