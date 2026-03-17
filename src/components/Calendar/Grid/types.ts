import React from "react";
import { PaginatedSchedulerData, SchedulerProjectData } from "@/types/global";

export type GridProps<TMeta = unknown> = {
  zoom: number;
  rows: number;
  data: PaginatedSchedulerData<TMeta>;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type GridComponent = <TMeta = unknown>(
  props: GridProps<TMeta> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

export type StyledSpanProps = {
  position: "left" | "right";
};
