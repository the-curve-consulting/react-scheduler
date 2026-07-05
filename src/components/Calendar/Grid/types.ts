import React from "react";
import {
  HolidayTileClickData,
  PaginatedSchedulerData,
  SchedulerProjectData,
  WorkingDuration
} from "@/types/global";

export type GridProps<TMeta = unknown> = {
  zoom: number;
  rows: number;
  data: PaginatedSchedulerData<TMeta>;
  workingDurationsPerPerson: WorkingDuration[][];
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
};

export type GridComponent = <TMeta = unknown>(
  props: GridProps<TMeta> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

export type StyledSpanProps = {
  position: "left" | "right";
};
