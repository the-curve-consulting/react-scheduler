import { PaginatedSchedulerData, SchedulerProjectData } from "@/types/global";

export type UsePaginationData<TMeta = unknown> = {
  /**
   * Represents paginated data on current page
   */
  page: PaginatedSchedulerData<TMeta>;
  /**
   * Current page number
   */
  currentPageNum: number;
  /**
   * Total amount of pages
   */
  pagesAmount: number;
  /**
   * Sorted resources per item.
   */
  projectsPerPerson: SchedulerProjectData<TMeta>[][][];
  /**
   * Callback function to load next page
   */
  next: () => void;
  /**
   * Callback function to load previous page
   */
  previous: () => void;

  /**
   * Jumps to first page
   */
  reset: () => void;
};
