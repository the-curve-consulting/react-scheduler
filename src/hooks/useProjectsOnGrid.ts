import { useMemo } from "react";
import { SchedulerData } from "@/types/global";
import { projectsOnGrid } from "@/utils/getProjectsOnGrid";

const useProjectsOnGrid = (data: SchedulerData) => {
  const dataKey = useMemo(() => JSON.stringify(data), [data]);

  return useMemo(() => {
    return projectsOnGrid(data);
  }, [dataKey]);
};

export default useProjectsOnGrid;
