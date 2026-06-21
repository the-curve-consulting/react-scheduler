import dayjs from "dayjs";
import {
  HolidayRequest,
  OccupancyData,
  SchedulerProjectData,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { getMaxHoursPerDay, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getAvailableWorkingHoursForDate } from "@/utils/holidayRequestHelper";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

/**
 * Converts active day projects into their requested taken time.
 *
 * Occupancy projects contribute fixed requested time when the day has available
 * working time. Throughput projects scale against holiday-adjusted available hours,
 * and can still create overtime when combined throughput is greater than 100%.
 *
 * @param occupancy Projects active on the focused day.
 * @param maxHoursPerDay Available working hours for the day after holidays.
 * @returns Taken time per active project.
 */
const getHoursAndMinutes = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  maxHoursPerDay: number
): TimeUnits[] => {
  return occupancy.map((item) => {
    if (isOccupancyProject(item)) {
      return maxHoursPerDay > 0 ? getDuration(item.occupancy) : { hours: 0, minutes: 0 };
    }

    const durationSeconds = item.throughput * maxHoursPerDay * 3600;
    return getDuration(durationSeconds);
  });
};

/**
 * Calculates tooltip occupancy totals for one calendar day.
 *
 * The day's capacity is reduced by holidays before free and overtime are computed.
 *
 * @param occupancy Projects active on the focused day.
 * @param focusedDate Day represented by the tooltip.
 * @param workingDuration Working-duration definition active on the focused day.
 * @param holidayRequests Holiday requests overlapping the focused day.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @param startHour Hour of day at which work starts.
 * @returns Taken, free, and overtime values for the focused day.
 */
export const getDayOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration,
  holidayRequests: HolidayRequest[],
  halfDayHours: number,
  startHour: number
): OccupancyData => {
  const maxHours = getMaxHoursPerDay(focusedDate, workingDuration);
  const availableHours = getAvailableWorkingHoursForDate(
    focusedDate,
    maxHours,
    holidayRequests,
    startHour,
    halfDayHours
  );
  const hoursAndMinutes = getHoursAndMinutes(occupancy, availableHours);
  const { hours: totalHours, minutes: totalMinutes } = getTotalHoursAndMinutes(hoursAndMinutes);

  const { free, overtime } = getTimeOccupancy(availableHours, {
    hours: totalHours,
    minutes: totalMinutes
  });

  return {
    taken: { hours: Math.max(0, totalHours), minutes: Math.max(0, totalMinutes) },
    free,
    overtime
  };
};
