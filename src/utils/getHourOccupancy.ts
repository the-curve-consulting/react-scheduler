import dayjs from "dayjs";
import {
  HolidayRequest,
  OccupancyData,
  SchedulerProjectData,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { secondsInHour } from "@/constants";
import { getDuration } from "@/utils/getDuration";
import { getTimeOccupancy } from "@/utils/getTimeOccupancy";
import { getMaxHoursPerDay, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getAvailableWorkWindow, getHolidayRequestsForDay } from "@/utils/holidayRequestHelper";

/**
 * Calculates the overlapping seconds between two time ranges.
 *
 * @param start Start of the measured interval.
 * @param end End of the measured interval.
 * @param rangeStart Start of the clipping range.
 * @param rangeEnd End of the clipping range.
 * @returns Number of seconds shared by both ranges.
 */
const getOverlapSeconds = (
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
): number => {
  const overlapStart = start.isAfter(rangeStart) ? start : rangeStart;
  const overlapEnd = end.isBefore(rangeEnd) ? end : rangeEnd;

  return Math.max(overlapEnd.diff(overlapStart, "second"), 0);
};

/**
 * Resolves taken time inside one focused hour.
 *
 * Projects are laid out in row order from the day's available work start. Occupancy
 * projects use fixed requested time, while throughput projects scale with the day's
 * holiday-adjusted available hours.
 *
 * @param projectRows Project rows for the focused resource.
 * @param focusedDate Start of the hour represented by the tooltip.
 * @param dayStart Start of the holiday-adjusted work window.
 * @param availableDayHours Available working hours for the full day after holidays.
 * @returns Taken time inside the focused hour.
 */
const getHoursAndMinutes = <TMeta>(
  projectRows: SchedulerProjectData<TMeta>[][],
  focusedDate: dayjs.Dayjs,
  dayStart: dayjs.Dayjs,
  availableDayHours: number
): TimeUnits => {
  let cumulativeTimeSeconds = 0;
  const focusedHourEnd = focusedDate.add(1, "hour");

  for (const row of projectRows) {
    const currentDayProject = row.find((item) =>
      dayjs(focusedDate).isBetween(item.startDate, item.endDate, "day", "[]")
    );

    if (!currentDayProject) continue;

    let occupancy = 0;
    if (isOccupancyProject(currentDayProject)) {
      occupancy = availableDayHours > 0 ? currentDayProject.occupancy : 0;
    } else {
      occupancy = currentDayProject.throughput * availableDayHours * 3600;
    }

    const projectEndHour = dayStart.add(occupancy + cumulativeTimeSeconds, "second");
    const occupiedSeconds = getOverlapSeconds(
      dayStart,
      projectEndHour,
      focusedDate,
      focusedHourEnd
    );

    if (occupiedSeconds >= secondsInHour) {
      return { hours: 1, minutes: 0 };
    }

    cumulativeTimeSeconds += occupancy;
  }

  const projectEndHour = dayStart.add(cumulativeTimeSeconds, "second");
  const occupiedSeconds = getOverlapSeconds(dayStart, projectEndHour, focusedDate, focusedHourEnd);

  return getDuration(occupiedSeconds);
};

/**
 * Calculates tooltip occupancy totals for one hourly cell.
 *
 * The cell capacity is the overlap between the focused hour and the holiday-adjusted
 * work window. Taken time is clipped to the same focused hour.
 *
 * @param projectRows Project rows for the focused resource.
 * @param focusedDate Start of the hour represented by the tooltip.
 * @param workingDuration Working-duration definition active on the focused day.
 * @param holidayRequests Holiday requests overlapping the focused day.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @param startHour Hour of day at which work starts.
 * @returns Taken, free, and overtime values for the focused hour.
 */
export const getHourOccupancy = <TMeta>(
  projectRows: SchedulerProjectData<TMeta>[][],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration,
  holidayRequests: HolidayRequest[],
  halfDayHours: number,
  startHour: number
): OccupancyData => {
  const maxHours = getMaxHoursPerDay(focusedDate, workingDuration);

  const workWindow = getAvailableWorkWindow(
    focusedDate,
    maxHours,
    getHolidayRequestsForDay(focusedDate, holidayRequests),
    startHour,
    halfDayHours
  );
  const focusedHourEnd = focusedDate.add(1, "hour");
  const allowedWorkingDuration = workWindow
    ? getOverlapSeconds(workWindow.start, workWindow.end, focusedDate, focusedHourEnd) /
      secondsInHour
    : 0;
  const dayStart = workWindow ? workWindow.start : focusedDate.hour(startHour).minute(0);
  const availableDayHours = workWindow ? workWindow.end.diff(workWindow.start, "hour", true) : 0;

  const hoursAndMinutes = getHoursAndMinutes(projectRows, focusedDate, dayStart, availableDayHours);
  const { free, overtime } = getTimeOccupancy(allowedWorkingDuration, hoursAndMinutes);

  return {
    taken: hoursAndMinutes,
    free,
    overtime
  };
};
