import { SchedulerData } from "@/types/global";
import { ProjectDeleteUpdate } from "../types";

const deleteProjectsByIds = (
  rows: SchedulerData,
  updates: ProjectDeleteUpdate[]
): SchedulerData => {
  const updatesByRowId = new Map(updates.map((update) => [update.rowId, update.projectIds]));

  return rows.map((row) => {
    const projectIdsToDelete = updatesByRowId.get(row.id);
    if (!projectIdsToDelete) return row;

    const updatedProjects = row.data.filter((project) => !projectIdsToDelete.includes(project.id));

    return {
      ...row,
      data: updatedProjects
    };
  });
};

export default deleteProjectsByIds;
