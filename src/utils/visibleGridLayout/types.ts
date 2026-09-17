import dayjs from "dayjs";
import { HolidayRequest, SchedulerProjectData, WorkingDuration } from "@/types/global";
import { HolidayKind, WorkWindow } from "@/utils/holidayRequestHelper";

/** Inclusive timeline bounds used to calculate and project scheduler layouts. */
export type VisibleRange = {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

/** Availability information calculated for one resource on one calendar day. */
export type ResourceDayContext = {
  workWindow: WorkWindow | null;
  availableHours: number;
};

/** Day context cache keyed by the start-of-day timestamp. */
export type CachedResourceDayMap = Map<number, ResourceDayContext>;

/** Holiday kinds affecting a resource, keyed by the start-of-day timestamp. */
export type HolidayKindsByDay = Map<number, HolidayKind[]>;

/** Availability caches owned by one scheduler resource. */
export type ResourceAvailabilityCache = {
  dayContextsByDay: CachedResourceDayMap;
  holidayKindsByDay: HolidayKindsByDay;
};

/** Availability caches keyed by scheduler resource ID. */
export type ResourceDayCache = Map<string, ResourceAvailabilityCache>;

/** Sequential placement of one project within a complete hourly day layout. */
export type HourlyDayPlacement<TMeta> = {
  project: SchedulerProjectData<TMeta>;
  rowIndex: number;
  startDateTime: dayjs.Dayjs;
  endDateTime: dayjs.Dayjs;
};

/** Complete hourly day layouts keyed first by resource ID and then by day timestamp. */
export type HourlyDayPlacementCache<TMeta> = Map<string, Map<number, HourlyDayPlacement<TMeta>[]>>;

/** Render-ready placement of one holiday request. */
export type HolidayPlacement = {
  holidayRequest: HolidayRequest;
  kind: HolidayKind;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

/** Fields shared by every render-ready resource layout. */
export type VisibleLayoutResourceBase = {
  resourceId: string;
  visibleRowsCount: number;
  holidayPlacements: HolidayPlacement[];
};

/** Render data used by weekly and daily scheduler views. */
export type RangeVisibleLayoutResource<TMeta> = VisibleLayoutResourceBase & {
  mode: "range";
  visibleProjectRows: SchedulerProjectData<TMeta>[][];
  dayContextsByDay: ReadonlyMap<number, ResourceDayContext>;
};

/** Render data used by the hourly scheduler view. */
export type HourlyVisibleLayoutResource<TMeta> = VisibleLayoutResourceBase & {
  mode: "hourly";
  visibleHourlyPlacements: HourlyDayPlacement<TMeta>[];
};

/** Render-ready layout for one resource, discriminated by scheduler view mode. */
export type VisibleLayoutResource<TMeta> =
  | RangeVisibleLayoutResource<TMeta>
  | HourlyVisibleLayoutResource<TMeta>;

/** Sorted working-duration definitions keyed by scheduler resource ID. */
export type WorkingDurationsByResource = ReadonlyMap<string, WorkingDuration[]>;
