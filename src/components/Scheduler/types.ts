import React from "react";
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

export type ProjectUpdate<TMeta = unknown> = {
  rowId: string;
  projects: SchedulerProjectData<TMeta>[];
};

export type ProjectDeleteUpdate = {
  rowId: string;
  projectIds: string[];
};

export type SchedulerHandle<TMeta = unknown> = {
  invalidate: () => void;
  upsertProjects: (updates: ProjectUpdate<TMeta>[]) => void;
  deleteProjects: (updates: ProjectDeleteUpdate[]) => void;
};

export type SchedulerBaseProps<TMeta = unknown> = {
  isLoading?: boolean;
  config?: Config;
  startDate?: string;
  dataSourceKey?: string;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
  transformData?: (data: SchedulerData<TMeta>) => SchedulerData<TMeta>;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
};

export type SchedulerStaticProps<TMeta = unknown> = SchedulerBaseProps<TMeta> & {
  data: SchedulerData<TMeta>;
  initialData?: never;
  onFetchData?: never;
};

export type SchedulerAsyncProps<TMeta = unknown> = SchedulerBaseProps<TMeta> & {
  onFetchData: (params: FetchDataParams) => Promise<SchedulerData<TMeta>>;
  initialData?: SchedulerData<TMeta>;
  data?: never;
};

export type SchedulerProps<TMeta = unknown> =
  | SchedulerStaticProps<TMeta>
  | SchedulerAsyncProps<TMeta>;

export type SchedulerComponent = <TMeta = unknown>(
  props: SchedulerProps<TMeta> & { ref?: React.ForwardedRef<SchedulerHandle<TMeta>> }
) => React.ReactElement | null;

export type StyledOutsideWrapperProps = {
  showScroll: boolean;
};

export const emptySchedulerFetchLoadingState: SchedulerFetchLoadingState = {
  any: false,
  blocking: false,
  forward: false,
  backward: false
};
