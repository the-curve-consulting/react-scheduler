import dayjs from "dayjs";
import { HolidayRequest } from "@/types/global";
import { minutesInHour } from "@/constants";

/**
 * Normalised holiday availability category used by tile placement.
 */
export type HolidayKind = "full" | "morning" | "afternoon";

/**
 * Time interval in which project work can be rendered for a single day.
 */
export type WorkWindow = {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
};

/**
 * Aggregated holiday categories for all requests affecting one day.
 */
type HolidayKindSummary = {
  full: boolean;
  morning: boolean;
  afternoon: boolean;
};

/**
 * Classifies backend holiday data into scheduler availability semantics.
 *
 * @param holidayRequest Holiday request returned by the scheduler data source.
 * @returns Normalised holiday kind. Multi-day and whole-day requests are treated as full-day.
 */
export const getHolidayKind = (holidayRequest: HolidayRequest): HolidayKind => {
  const singleDay = dayjs(holidayRequest.leave_from).isSame(holidayRequest.leave_to, "day");

  if (!singleDay || !holidayRequest.morning_or_afternoon) return "full";

  return holidayRequest.morning_or_afternoon === "Morning" ? "morning" : "afternoon";
};

/**
 * Summarises all holiday request kinds present on a single calendar day.
 *
 * @param holidayRequests Holiday requests overlapping one day.
 * @returns Boolean flags for each supported holiday kind.
 */
const getHolidayKindSummary = (holidayRequests: HolidayRequest[]): HolidayKindSummary => {
  const holidayKinds = holidayRequests.map(getHolidayKind);

  return {
    full: holidayKinds.includes("full"),
    morning: holidayKinds.includes("morning"),
    afternoon: holidayKinds.includes("afternoon")
  };
};

/**
 * Builds the unadjusted working window for a day.
 *
 * @param date Day to build the window for.
 * @param workingHours Person-specific working hours configured for the day.
 * @param startHour Hour of day at which work starts.
 * @returns Work window, or `null` when the day has no working hours.
 */
const getBaseWorkWindow = (
  date: dayjs.Dayjs,
  workingHours: number,
  startHour: number
): WorkWindow | null => {
  if (workingHours <= 0) return null;

  const start = date.startOf("day").hour(startHour);

  return {
    start,
    end: start.add(workingHours, "hour")
  };
};

/**
 * Applies holiday availability rules to a working window.
 *
 * Full-day holidays remove the window. Morning holidays keep only the afternoon
 * portion, and afternoon/half-day holidays keep only the morning portion.
 *
 * @param workWindow Base working window before holiday adjustment.
 * @param holidays Aggregated holiday kinds for the day.
 * @param halfDayHours Number of hours used as the half-day boundary.
 * @returns Adjusted work window, or `null` when no project work should render.
 */
const applyHolidayAvailability = (
  workWindow: WorkWindow,
  holidays: HolidayKindSummary,
  halfDayHours: number
): WorkWindow | null => {
  if (holidays.full || (holidays.morning && holidays.afternoon)) return null;

  const halfDayBoundary = workWindow.start.add(halfDayHours, "hour");

  if (holidays.morning) {
    return halfDayBoundary.isBefore(workWindow.end)
      ? { start: halfDayBoundary, end: workWindow.end }
      : null;
  }

  if (holidays.afternoon) {
    const end = halfDayBoundary.isBefore(workWindow.end) ? halfDayBoundary : workWindow.end;
    return workWindow.start.isBefore(end) ? { start: workWindow.start, end } : null;
  }

  return workWindow;
};

/**
 * Resolves the project-rendering work window for a day after working-duration and holiday rules.
 *
 * @param date Day to resolve.
 * @param workingHours Person-specific working hours configured for the day.
 * @param holidayRequests Holiday requests overlapping the day.
 * @param startHour Hour of day at which work starts.
 * @param halfDayHours Number of hours used as the holiday half-day boundary.
 * @returns Available work window, or `null` when the day is unavailable.
 */
export const getAvailableWorkWindow = (
  date: dayjs.Dayjs,
  workingHours: number,
  holidayRequests: HolidayRequest[],
  startHour: number,
  halfDayHours: number
): WorkWindow | null => {
  const workWindow = getBaseWorkWindow(date, workingHours, startHour);
  if (!workWindow) return null;
  if (!holidayRequests.length) return workWindow;

  return applyHolidayAvailability(workWindow, getHolidayKindSummary(holidayRequests), halfDayHours);
};

/**
 * Resolves the visible tile window for a holiday request.
 *
 * Full-day holidays span the clipped request date range. Single-day morning and
 * afternoon holidays span only the configured half-day window.
 *
 * @param startDate Clipped holiday start date within the visible range.
 * @param endDate Clipped holiday end date within the visible range.
 * @param startHour Hour of day at which the normal work day starts.
 * @param holidayRequest Holiday request to render.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @returns Tile start/end dates for rendering the holiday.
 */
export const getHolidayWindow = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  startHour: number,
  holidayRequest: HolidayRequest,
  halfDayHours: number
): { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } | null => {
  const holidayKind = getHolidayKind(holidayRequest);

  const start =
    holidayKind === "full"
      ? startDate.startOf("day")
      : startDate
          .startOf("day")
          .minute(
            (holidayKind === "morning" ? startHour : startHour + halfDayHours) * minutesInHour
          );

  const end = holidayKind === "full" ? endDate.endOf("day") : start.add(halfDayHours, "hour");

  return { startDate: start, endDate: end };
};
