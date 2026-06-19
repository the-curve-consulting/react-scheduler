import {
  PaginatedSchedulerData,
  PaginatedSchedulerRow,
  SchedulerData,
  SchedulerProjectData
} from "@/types/global";

export const splitToPages = <TMeta>(
  data: SchedulerData<TMeta>,
  projectsPerPerson: SchedulerProjectData<TMeta>[][][],
  rowsPerPerson: number[],
  recordsThreshold: number
) => {
  const pages: PaginatedSchedulerData<TMeta>[] = [];

  let leftIndex = 0;
  let singlePage: PaginatedSchedulerRow<TMeta>[] = [];
  let pageRecords = 0;

  if (projectsPerPerson.length > recordsThreshold) {
    projectsPerPerson.forEach((projects, i) => {
      const newItem: PaginatedSchedulerRow<TMeta> = {
        id: data[i].id,
        label: data[i].label,
        data: projects,
        workingDurations: data[i].workingDurations,
        holidayRequests: data[i].holidayRequests
      };

      if (pageRecords >= recordsThreshold) {
        pages.push(singlePage);
        leftIndex += singlePage.length;
        singlePage = [];
        pageRecords = 0;
      }

      pageRecords++;
      singlePage.push(newItem);
    });

    if (rowsPerPerson.slice(leftIndex).length <= recordsThreshold) {
      singlePage = [];
      projectsPerPerson.slice(leftIndex).forEach((projects, i) => {
        const newItem: PaginatedSchedulerRow<TMeta> = {
          id: data[i + leftIndex].id,
          label: data[i + leftIndex].label,
          data: projects,
          workingDurations: data[i + leftIndex].workingDurations,
          holidayRequests: data[i + leftIndex].holidayRequests
        };
        singlePage.push(newItem);

        if (i === projectsPerPerson.length - leftIndex - 1) pages.push(singlePage);
      });
    }

    return pages;
  }
  projectsPerPerson.forEach((projects, i) => {
    const newItem: PaginatedSchedulerRow<TMeta> = {
      id: data[i].id,
      label: data[i].label,
      data: projects,
      workingDurations: data[i].workingDurations,
      holidayRequests: data[i].holidayRequests
    };
    singlePage.push(newItem);
  });

  pages.push(singlePage);

  return pages;
};
