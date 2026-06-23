import { memo, useMemo } from "react";
import dayjs from "dayjs";
import { HolidayRequest, SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";
import { secondsInHour } from "@/constants";
import { HourlyTile, Tile, HolidayTile } from "@/components";
import { isProjectVisible } from "@/utils/scrollHelpers";
import { getDailyTileSegments, getWeeklyTileSegments } from "@/utils/getTileSegments";
import {
  getWorkingHoursForDate,
  isOccupancyProject,
  sortWorkingDurations
} from "@/utils/workingDurationHelper";
import { getAvailableWorkWindow, getHolidayWindow, WorkWindow } from "@/utils/holidayRequestHelper";
import { PlacedTiles, ResourceTilesComponent, ResourceTilesProps } from "./types";

const ResourceTilesInner = <TMeta,>({
  data,
  zoom,
  rows,
  onTileClick,
  onHolidayTileClick,
  visibleStart,
  visibleEnd,
  workingDurations,
  holidayRequests,
  defaultStartHour,
  defaultWorkDayHours
}: ResourceTilesProps<TMeta>) => {
  const visibleStartDay = dayjs(visibleStart).startOf("day").valueOf();
  const visibleEndDay = dayjs(visibleEnd).endOf("day").valueOf();
  const halfDayHours = defaultWorkDayHours / 2;

  const sortedWorkingDurations = useMemo(
    () => sortWorkingDurations(workingDurations),
    [workingDurations]
  );

  const hoursByDay = useMemo(() => {
    const result = new Map<number, number>();
    let currentDate = dayjs(visibleStartDay);
    const endDate = dayjs(visibleEndDay);

    while (!currentDate.isAfter(endDate, "day")) {
      const dayKey = currentDate.startOf("day").valueOf();

      result.set(dayKey, getWorkingHoursForDate(currentDate, sortedWorkingDurations));

      currentDate = currentDate.add(1, "day");
    }

    return result;
  }, [visibleStartDay, visibleEndDay, sortedWorkingDurations]);

  const visibleHolidayRanges = useMemo(() => {
    const visibleStartDate = dayjs(visibleStartDay).startOf("day");
    const visibleEndDate = dayjs(visibleEndDay).startOf("day");

    return holidayRequests.flatMap((holidayRequest) => {
      const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
      const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

      if (leaveStart.isAfter(visibleEndDate) || leaveEnd.isBefore(visibleStartDate)) {
        return [];
      }

      return [
        {
          holidayRequest,
          startDate: leaveStart.isBefore(visibleStartDate) ? visibleStartDate : leaveStart,
          endDate: leaveEnd.isAfter(visibleEndDate) ? visibleEndDate : leaveEnd
        }
      ];
    });
  }, [visibleStartDay, visibleEndDay, holidayRequests]);

  const holidayRequestsByDay = useMemo(() => {
    const result = new Map<number, HolidayRequest[]>();

    for (const { holidayRequest, startDate, endDate } of visibleHolidayRanges) {
      let currentDate = startDate;

      while (!currentDate.isAfter(endDate, "day")) {
        const dayKey = currentDate.valueOf();
        result.set(dayKey, [...(result.get(dayKey) ?? []), holidayRequest]);
        currentDate = currentDate.add(1, "day");
      }
    }

    return result;
  }, [visibleHolidayRanges]);

  const workWindowsByDay = useMemo(() => {
    const result = new Map<number, WorkWindow | null>();
    let currentDate = dayjs(visibleStartDay);
    const visibleEndDate = dayjs(visibleEndDay);

    while (!currentDate.isAfter(visibleEndDate, "day")) {
      const dayKey = currentDate.startOf("day").valueOf();
      const workingHours = hoursByDay.get(dayKey) ?? 0;
      const workWindow = getAvailableWorkWindow(
        currentDate,
        workingHours,
        holidayRequestsByDay.get(dayKey) ?? [],
        defaultStartHour,
        halfDayHours
      );

      result.set(dayKey, workWindow);
      currentDate = currentDate.add(1, "day");
    }

    return result;
  }, [
    visibleStartDay,
    visibleEndDay,
    defaultStartHour,
    halfDayHours,
    holidayRequestsByDay,
    hoursByDay
  ]);

  const availableHoursByDay = useMemo(() => {
    const result = new Map<number, number>();

    for (const [dayKey, workWindow] of workWindowsByDay) {
      result.set(dayKey, workWindow ? workWindow.end.diff(workWindow.start, "hour", true) : 0);
    }

    return result;
  }, [workWindowsByDay]);

  const holidayTiles: PlacedTiles = useMemo(() => {
    const rowNo = Math.max(data.length, 1);
    return visibleHolidayRanges.flatMap(({ holidayRequest, startDate, endDate }) => {
      const holidayWindow = getHolidayWindow(
        startDate,
        endDate,
        defaultStartHour,
        holidayRequest,
        halfDayHours,
        zoom
      );

      if (holidayWindow === null) return [];

      return [
        <HolidayTile
          key={holidayRequest.id}
          startDate={holidayWindow.startDate}
          endDate={holidayWindow.endDate}
          rowIndex={rows}
          rowNo={rowNo}
          data={holidayRequest}
          zoom={zoom}
          onTileClick={onHolidayTileClick}
        />
      ];
    });
  }, [
    data.length,
    defaultStartHour,
    halfDayHours,
    onHolidayTileClick,
    rows,
    visibleHolidayRanges,
    zoom
  ]);

  const tiles = useMemo((): PlacedTiles => {
    const visibleStartDate = dayjs(visibleStart);
    const visibleEndDate = dayjs(visibleEnd);

    /**
     * Calculates how much of the remaining work window one project should occupy.
     *
     * Occupancy projects request fixed seconds and are clipped to the remaining
     * available window. Throughput projects scale from the full holiday-adjusted
     * day capacity, then are also clipped to the remaining window.
     *
     * @param project Project being rendered.
     * @param currentStartTime First available timestamp after previous same-day tiles.
     * @param workWindow Holiday-adjusted work window for the current day.
     * @returns Number of seconds this project can occupy from `currentStartTime`.
     */
    const calculateProjectOccupancySeconds = (
      project: SchedulerProjectData<TMeta>,
      currentStartTime: dayjs.Dayjs,
      workWindow: WorkWindow
    ): number => {
      const availableSeconds = Math.max(workWindow.end.diff(currentStartTime, "second"), 0);
      if (availableSeconds <= 0) return 0;

      if (isOccupancyProject(project)) {
        return Math.min(project.occupancy, availableSeconds);
      }

      const availableHours = workWindow.end.diff(workWindow.start, "hour", true);
      const projectSeconds = project.throughput * availableHours * secondsInHour;
      return Math.min(projectSeconds, availableSeconds);
    };

    /**
     * Builds hourly tiles for one project across the visible date range.
     *
     * `startDateTimes` is shared per day so each next project starts after the
     * previously rendered project on that day, matching the scheduler stacking logic.
     *
     * @param project Project being rendered.
     * @param rowIndex Project row index inside the resource.
     * @param rowOffset Number of rows reserved before project rows.
     * @param startDateTimes Last rendered end time keyed by visible day.
     * @returns Hourly tile elements for the project.
     */
    const renderHourlyTilesForProject = (
      project: SchedulerProjectData<TMeta>,
      rowIndex: number,
      rowOffset: number,
      startDateTimes: Record<string, dayjs.Dayjs>
    ): PlacedTiles => {
      const tilesPerProject: PlacedTiles = [];
      const projectStartDay = dayjs(project.startDate).startOf("day");
      const projectEndDay = dayjs(project.endDate).endOf("day");
      const iterationStartDay = projectStartDay.isAfter(visibleStartDate)
        ? projectStartDay
        : visibleStartDate;
      const iterationEndDay = projectEndDay.isBefore(visibleEndDate)
        ? projectEndDay
        : visibleEndDate;

      if (iterationStartDay.isAfter(iterationEndDay, "day")) {
        return tilesPerProject;
      }

      let currentDate = iterationStartDay;

      while (currentDate.isBefore(iterationEndDay) || currentDate.isSame(iterationEndDay)) {
        const currentDay = currentDate.startOf("day");
        const currentDateString = currentDay.format("YYYY-MM-DD");
        const dayKey = currentDay.valueOf();

        currentDate = currentDate.add(1, "day");

        const workWindow = workWindowsByDay.get(dayKey);
        if (!workWindow) continue;

        // Ensure if this project is on the same day as the previously rendered,
        // it starts after the previous project ends
        const previousEndTime = startDateTimes[currentDateString];
        const currentStartTime =
          previousEndTime && previousEndTime.isAfter(workWindow.start)
            ? previousEndTime
            : workWindow.start;

        const occupancy = calculateProjectOccupancySeconds(project, currentStartTime, workWindow);
        if (occupancy === 0) continue;
        let currentEndTime = currentStartTime.add(occupancy, "second");

        startDateTimes[currentDateString] = currentEndTime;
        if (currentEndTime.isAfter(visibleEndDate)) {
          currentEndTime = visibleEndDate;
        }

        // Skip tiles outside the visible date range to avoid unnecessary rendering
        if (
          currentStartTime.isAfter(currentEndTime) ||
          currentStartTime.isAfter(visibleEndDate) ||
          currentEndTime.isBefore(visibleStartDate)
        ) {
          continue;
        }

        const dayData: SchedulerProjectDayData<TMeta> = {
          data: project,
          startDateTime: currentStartTime,
          endDateTime: currentEndTime
        };

        tilesPerProject.push(
          <HourlyTile
            key={`${project.id}-${currentDateString}`}
            row={rowIndex + rowOffset}
            dayData={dayData}
            onTileClick={onTileClick}
          />
        );
      }

      return tilesPerProject;
    };

    if (zoom === 2) {
      // Hourly view
      const startDateTimes: Record<string, dayjs.Dayjs> = {};
      return data
        .map((projectsPerRow, rowIndex) =>
          projectsPerRow
            .filter((project) =>
              isProjectVisible(project.startDate, project.endDate, visibleStartDate, visibleEndDate)
            )
            .map((project) => renderHourlyTilesForProject(project, rowIndex, rows, startDateTimes))
        )
        .flat(3)
        .concat(holidayTiles);
    }

    // Regular view
    return data
      .map((projectsPerRow, rowIndex) =>
        projectsPerRow
          .filter((project) =>
            isProjectVisible(project.startDate, project.endDate, visibleStartDate, visibleEndDate)
          )
          .map((project) => {
            const segments =
              zoom === 0
                ? getWeeklyTileSegments(project, visibleStart, visibleEnd, availableHoursByDay)
                : getDailyTileSegments(project, visibleStart, visibleEnd, availableHoursByDay);

            return segments.map((segment) => (
              <Tile
                key={`${project.id}-${segment.startDate.valueOf()}-${segment.endDate.valueOf()}-${
                  segment.working
                }`}
                row={rowIndex + rows}
                data={segment.data}
                startDate={segment.startDate}
                endDate={segment.endDate}
                working={segment.working}
                zoom={zoom}
                onTileClick={onTileClick}
              />
            ));
          })
      )
      .flat(3)
      .concat(holidayTiles);
  }, [
    visibleStart,
    visibleEnd,
    zoom,
    data,
    availableHoursByDay,
    onTileClick,
    rows,
    workWindowsByDay,
    holidayTiles
  ]);

  return <>{tiles}</>;
};

const ResourceTiles = memo(ResourceTilesInner) as ResourceTilesComponent;

export default ResourceTiles;
