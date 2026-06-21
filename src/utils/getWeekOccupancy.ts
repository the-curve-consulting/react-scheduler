import dayjs from "dayjs";
import {
  HolidayRequest,
  OccupancyData,
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  SchedulerProjectDataThroughput,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { secondsInHour } from "@/constants";
import { getWorkingHoursForDate, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getAvailableWorkingHoursForDate } from "@/utils/holidayRequestHelper";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

/**
 * Holiday-adjusted capacity for one day in the visible week.
 */
type DayAvailability = {
  date: dayjs.Dayjs;
  availableHours: number;
};

/**
 * Builds holiday-adjusted availability for every day in a week range.
 *
 * @param weekStartDate First day in the weekly tooltip range.
 * @param weekEndDate Last day in the weekly tooltip range.
 * @param workingDurations Working-duration definitions relevant to the range.
 * @param holidayRequests Holiday requests overlapping the range.
 * @param startHour Hour of day at which work starts.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @returns Per-day available working hours after holidays are applied.
 */
const getWeeklyAvailability = (
  weekStartDate: dayjs.Dayjs,
  weekEndDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[],
  holidayRequests: HolidayRequest[],
  startHour: number,
  halfDayHours: number
): DayAvailability[] => {
  const days: DayAvailability[] = [];
  let currentDate = weekStartDate.startOf("day");
  const weekEnd = weekEndDate.startOf("day");

  while (!currentDate.isAfter(weekEnd, "day")) {
    const workingHours = getWorkingHoursForDate(currentDate, workingDurations);
    const availableHours = getAvailableWorkingHoursForDate(
      currentDate,
      workingHours,
      holidayRequests,
      startHour,
      halfDayHours
    );

    days.push({ date: currentDate, availableHours });
    currentDate = currentDate.add(1, "day");
  }

  return days;
};

/**
 * Calculates fixed occupancy demand across active days in a week.
 *
 * Fixed occupancy contributes on active days only when that day has available
 * working time after holidays.
 *
 * @param project Occupancy project to measure.
 * @param weekAvailability Holiday-adjusted day availability for the week.
 * @returns Requested taken time for the project in the week.
 */
const getHoursAndMinutesForOccupancy = <TMeta>(
  project: SchedulerProjectDataOccupancy<TMeta>,
  weekAvailability: DayAvailability[]
): TimeUnits => {
  let totalOccupancy = 0;

  for (const { date, availableHours } of weekAvailability) {
    const isActive = date.isBetween(project.startDate, project.endDate, "day", "[]");

    if (isActive) {
      totalOccupancy += availableHours > 0 ? project.occupancy : 0;
    }
  }

  return getDuration(totalOccupancy);
};

/**
 * Calculates throughput demand across active days in a week.
 *
 * Throughput scales with each active day's holiday-adjusted available hours. Multiple
 * throughput projects can still create overtime when their total throughput exceeds 100%.
 *
 * @param project Throughput project to measure.
 * @param weekAvailability Holiday-adjusted day availability for the week.
 * @returns Requested taken time for the project in the week.
 */
const getHoursAndMinutesForThroughput = <TMeta>(
  project: SchedulerProjectDataThroughput<TMeta>,
  weekAvailability: DayAvailability[]
): TimeUnits => {
  let totalHours = 0;

  for (const { date, availableHours } of weekAvailability) {
    const isActive = date.isBetween(project.startDate, project.endDate, "day", "[]");

    if (isActive) {
      totalHours += project.throughput * availableHours;
    }
  }

  return getDuration(totalHours * secondsInHour);
};

/**
 * Converts all weekly active projects into requested taken time.
 *
 * @param projects Projects active in the weekly tooltip range.
 * @param weekAvailability Holiday-adjusted day availability for the week.
 * @returns Taken time per active project.
 */
const getHoursAndMinutes = <TMeta>(
  projects: SchedulerProjectData<TMeta>[],
  weekAvailability: DayAvailability[]
): TimeUnits[] => {
  return projects.map((item) => {
    if (isOccupancyProject(item)) {
      return getHoursAndMinutesForOccupancy(item, weekAvailability);
    }

    return getHoursAndMinutesForThroughput(item, weekAvailability);
  });
};

/**
 * Calculates tooltip occupancy totals for a week range.
 *
 * Weekly capacity is the sum of holiday-adjusted available hours for each day.
 * Project demand is calculated per active day so partial-week holidays affect both
 * free time and requested throughput time.
 *
 * @param occupancy Projects active in the weekly tooltip range.
 * @param weekStartDate First day represented by the tooltip.
 * @param weekEndDate Last day represented by the tooltip.
 * @param workingDurations Working-duration definitions relevant to the week.
 * @param holidayRequests Holiday requests overlapping the week.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @param startHour Hour of day at which work starts.
 * @returns Taken, free, and overtime values for the week.
 */
export const getWeekOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  weekStartDate: dayjs.Dayjs,
  weekEndDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[],
  holidayRequests: HolidayRequest[],
  halfDayHours: number,
  startHour: number
): OccupancyData => {
  const weekAvailability = getWeeklyAvailability(
    weekStartDate,
    weekEndDate,
    workingDurations,
    holidayRequests,
    startHour,
    halfDayHours
  );
  const maxHours = weekAvailability.reduce((sum, day) => sum + day.availableHours, 0);

  const hoursAndMinutes = getHoursAndMinutes(occupancy, weekAvailability);

  const { hours: totalHours, minutes: totalMinutes } = getTotalHoursAndMinutes(hoursAndMinutes);

  const { free, overtime } = getTimeOccupancy(maxHours, {
    hours: totalHours,
    minutes: totalMinutes
  });

  return {
    taken: { hours: Math.max(0, totalHours), minutes: Math.max(0, totalMinutes) },
    free,
    overtime
  };
};
