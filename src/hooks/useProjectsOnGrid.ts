import { useMemo } from "react";
import { SchedulerData } from "@/types/global";
import { projectsOnGrid } from "@/utils/getProjectsOnGrid";

const useProjectsOnGrid = <TMeta>(data: SchedulerData<TMeta>) => {
  return useMemo(() => projectsOnGrid<TMeta>(data), [data]);
};

export default useProjectsOnGrid;
