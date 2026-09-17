import dayjs from "dayjs";
import { HolidayRequest } from "@/types/global";
import { getHolidayKind, getHolidayWindow } from "@/utils/holidayRequestHelper";
import { HolidayPlacement, VisibleRange } from "./types";

/**
 * Produces render-ready holiday placements intersecting a visible range.
 *
 * Holiday requests are clipped to visible calendar days before their zoom-specific
 * working window is calculated.
 */
export const getHolidayPlacements = (
  zoom: number,
  holidayRequests: HolidayRequest[],
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): HolidayPlacement[] => {
  const visibleStart = visibleRange.startDate.startOf("day");
  const visibleEnd = visibleRange.endDate.startOf("day");

  return holidayRequests.flatMap((holidayRequest) => {
    const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
    const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

    if (leaveStart.isAfter(visibleEnd, "day") || leaveEnd.isBefore(visibleStart, "day")) {
      return [];
    }

    const holidayStart = leaveStart.isBefore(visibleStart, "day") ? visibleStart : leaveStart;
    const holidayEnd = leaveEnd.isAfter(visibleEnd, "day") ? visibleEnd : leaveEnd;
    const kind = getHolidayKind(holidayRequest);
    const holidayWindow = getHolidayWindow(
      holidayStart,
      holidayEnd,
      defaultStartHour,
      kind,
      defaultWorkDayHours / 2,
      zoom
    );

    return holidayWindow
      ? [
          {
            holidayRequest,
            kind,
            startDate: holidayWindow.startDate,
            endDate: holidayWindow.endDate
          }
        ]
      : [];
  });
};
