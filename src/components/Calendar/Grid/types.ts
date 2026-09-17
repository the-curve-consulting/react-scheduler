import React from "react";
import {
  HolidayTileClickData,
  SchedulerEmptyClickData,
  SchedulerProjectData,
  SchedulerTileChange
} from "@/types/global";
import { VisibleLayoutResource } from "@/utils/visibleGridLayout";

export type GridProps<TMeta = unknown> = {
  rows: number;
  visibleLayoutsPerResource: VisibleLayoutResource<TMeta>[];
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
  onEmptyClick?: (data: SchedulerEmptyClickData) => void;
  onTileChange?: (change: SchedulerTileChange, data: SchedulerProjectData<TMeta>) => void;
};

export type GridComponent = <TMeta = unknown>(
  props: GridProps<TMeta> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

export type StyledSpanProps = {
  position: "left" | "right";
};
