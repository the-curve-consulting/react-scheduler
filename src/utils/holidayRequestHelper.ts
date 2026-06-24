import dayjs from "dayjs";
import { HolidayRequest } from "@/types/global";
import { hoursInDay, minutesInHour } from "@/constants";

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
 * Summarises pre-computed holiday kinds present on a single calendar day.
 *
 * @param holidayKinds Normalised holiday kinds overlapping one day.
 * @returns Boolean flags for each supported holiday kind.
 */
const getHolidayKindSummaryFromKinds = (holidayKinds: HolidayKind[]): HolidayKindSummary => ({
  full: holidayKinds.includes("full"),
  morning: holidayKinds.includes("morning"),
  afternoon: holidayKinds.includes("afternoon")
});

/**
 * Summarises all holiday request kinds present on a single calendar day.
 *
 * @param holidayRequests Holiday requests overlapping one day.
 * @returns Boolean flags for each supported holiday kind.
 */
const getHolidayKindSummary = (holidayRequests: HolidayRequest[]): HolidayKindSummary =>
  getHolidayKindSummaryFromKinds(holidayRequests.map(getHolidayKind));

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
 * Resolves the project-rendering work window for a day from pre-computed holiday kinds.
 *
 * Identical to `getAvailableWorkWindow` but skips per-day holiday classification when
 * kinds have already been computed once per request (avoids repeated date parsing in
 * the tile-rendering hot path).
 *
 * @param date Day to resolve.
 * @param workingHours Person-specific working hours configured for the day.
 * @param holidayKinds Normalised holiday kinds overlapping the day.
 * @param startHour Hour of day at which work starts.
 * @param halfDayHours Number of hours used as the holiday half-day boundary.
 * @returns Available work window, or `null` when the day is unavailable.
 */
export const getAvailableWorkWindowFromKinds = (
  date: dayjs.Dayjs,
  workingHours: number,
  holidayKinds: HolidayKind[],
  startHour: number,
  halfDayHours: number
): WorkWindow | null => {
  const workWindow = getBaseWorkWindow(date, workingHours, startHour);
  if (!workWindow) return null;
  if (!holidayKinds.length) return workWindow;

  return applyHolidayAvailability(
    workWindow,
    getHolidayKindSummaryFromKinds(holidayKinds),
    halfDayHours
  );
};

/**
 * Resolves the visible tile window for a holiday request.
 *
 * Hourly zoom uses the configured business-day start and half-day duration.
 * Daily and weekly zoom use visual half-cell/full-cell spans, so partial holidays
 * occupy exactly half of the rendered day even when a business half-day is not
 * twelve real hours.
 *
 * @param startDate Clipped holiday start date within the visible range.
 * @param endDate Clipped holiday end date within the visible range.
 * @param startHour Hour of day at which the normal work day starts.
 * @param holidayKind Pre-computed normalised kind for the holiday request.
 * @param halfDayHours Number of hours represented by a half-day holiday.
 * @param zoom Current zoom level. Non-hourly zooms use visual half-day spans.
 * @returns Tile start/end dates for rendering the holiday.
 */
export const getHolidayWindow = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  startHour: number,
  holidayKind: HolidayKind,
  halfDayHours: number,
  zoom: number
): { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } | null => {
  const dayStart = startDate.startOf("day");
  const halfRealDay = hoursInDay / 2;

  if (zoom !== 2) {
    const start = holidayKind === "afternoon" ? dayStart.add(halfRealDay, "hour") : dayStart;
    const end =
      holidayKind === "morning" ? dayStart.add(halfRealDay, "hour") : endDate.endOf("day");

    return { startDate: start, endDate: end };
  }

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

/**
 * Resolves how many working hours remain on one day after holiday rules.
 *
 * This returns only the duration of the available work window. Use
 * `getAvailableWorkWindow` directly when the exact start/end times are needed.
 *
 * `holidayRequests` must already be scoped to `date` (e.g. via
 * `getHolidayRequestsForDay`); this function does not filter again.
 *
 * @param date Day to resolve.
 * @param workingHours Person-specific working hours configured for the day.
 * @param holidayRequests Holiday requests already scoped to the day.
 * @param startHour Hour of day at which work starts.
 * @param halfDayHours Number of hours used as the holiday half-day boundary.
 * @returns Available working hours for the day after holidays are applied.
 */
export const getAvailableWorkingHoursForDate = (
  date: dayjs.Dayjs,
  workingHours: number,
  holidayRequests: HolidayRequest[],
  startHour: number,
  halfDayHours: number
): number => {
  const workWindow = getAvailableWorkWindow(
    date,
    workingHours,
    holidayRequests,
    startHour,
    halfDayHours
  );

  return workWindow ? workWindow.end.diff(workWindow.start, "hour", true) : 0;
};

/**
 * Filters holiday requests to those overlapping a single day.
 *
 * @param date Day to test.
 * @param holidayRequests Holiday requests to filter.
 * @returns Holiday requests overlapping the given day.
 */
export const getHolidayRequestsForDay = (
  date: dayjs.Dayjs,
  holidayRequests: HolidayRequest[]
): HolidayRequest[] => getHolidayRequestsForDateRange(date, date, holidayRequests);

/**
 * Filters holiday requests to those overlapping an inclusive date range.
 *
 * @param startDate First day in the range.
 * @param endDate Last day in the range.
 * @param holidayRequests Holiday requests to filter.
 * @returns Holiday requests whose leave range intersects the given range.
 */
export const getHolidayRequestsForDateRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  holidayRequests: HolidayRequest[]
): HolidayRequest[] => {
  const rangeStart = startDate.startOf("day");
  const rangeEnd = endDate.endOf("day");

  return holidayRequests.filter((holidayRequest) => {
    const leaveFrom = dayjs(holidayRequest.leave_from);
    const leaveTo = dayjs(holidayRequest.leave_to);

    return !leaveFrom.isAfter(rangeEnd) && !leaveTo.isBefore(rangeStart);
  });
};

/**
 * Buckets holiday requests by the start-of-day timestamps they overlap within a range.
 *
 * Parses each request's dates once and walks only the days it covers, so callers can
 * resolve a single day's holidays with a map lookup instead of re-filtering the whole
 * list per day.
 *
 * @param rangeStart First day in the range.
 * @param rangeEnd Last day in the range.
 * @param holidayRequests Holiday requests to bucket.
 * @returns Map keyed by start-of-day ms to the holiday requests overlapping that day.
 */
export const groupHolidayRequestsByDay = (
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs,
  holidayRequests: HolidayRequest[]
): Map<number, HolidayRequest[]> => {
  const result = new Map<number, HolidayRequest[]>();
  const windowStart = rangeStart.startOf("day");
  const windowEnd = rangeEnd.startOf("day");

  for (const holidayRequest of holidayRequests) {
    const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
    const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

    if (leaveStart.isAfter(windowEnd) || leaveEnd.isBefore(windowStart)) continue;

    let currentDate = leaveStart.isBefore(windowStart) ? windowStart : leaveStart;
    const lastDate = leaveEnd.isAfter(windowEnd) ? windowEnd : leaveEnd;

    while (!currentDate.isAfter(lastDate, "day")) {
      const dayKey = currentDate.valueOf();
      let bucket = result.get(dayKey);
      if (!bucket) {
        bucket = [];
        result.set(dayKey, bucket);
      }
      bucket.push(holidayRequest);
      currentDate = currentDate.add(1, "day");
    }
  }

  return result;
};
