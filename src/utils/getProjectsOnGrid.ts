import { SchedulerData, SchedulerProjectData } from "@/types/global";
import { setProjectsInRows } from "./setProjectsInRows";

type ProjectsData<TMeta = unknown> = [
  projectsPerPerson: SchedulerProjectData<TMeta>[][][],
  rowsPerPerson: number[]
];

export const projectsOnGrid = <TMeta>(data: SchedulerData<TMeta>) => {
  const initialProjectsData: ProjectsData<TMeta> = [[], []];
  const [projectsPerPerson, rowsPerPerson] = data.reduce((acc, curr) => {
    const projectsInRows = setProjectsInRows<TMeta>(curr.data);
    acc[0].push(projectsInRows);
    acc[1].push(Math.max(projectsInRows.length, 1));
    return acc;
  }, initialProjectsData);
  return { projectsPerPerson, rowsPerPerson };
};
