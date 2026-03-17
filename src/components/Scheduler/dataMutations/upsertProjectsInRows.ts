import { SchedulerData } from "@/types/global";
import { ProjectUpdate } from "../types";

const upsertProjectsInRows = <TMeta>(
  rows: SchedulerData<TMeta>,
  updates: ProjectUpdate<TMeta>[]
): SchedulerData<TMeta> => {
  const updatesByRowId = new Map(updates.map((update) => [update.rowId, update.projects]));

  return rows.map((row) => {
    const updatedProjects = updatesByRowId.get(row.id);
    if (!updatedProjects) return row;

    const updatedProjectsIds = updatedProjects.map((project) => project.id);
    const rowProjectsExUpdates = row.data.filter(
      (project) => !updatedProjectsIds.includes(project.id)
    );

    return {
      ...row,
      data: [...rowProjectsExUpdates, ...updatedProjects]
    };
  });
};

export default upsertProjectsInRows;
