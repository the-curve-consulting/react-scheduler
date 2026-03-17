import { PaginatedSchedulerData } from "@/types/global";

export const getTotalRowsPerPage = <TMeta>(page: PaginatedSchedulerData<TMeta>) =>
  page ? page.map((page) => page.data.length).reduce((acc, curr) => acc + Math.max(curr, 1), 0) : 0;
