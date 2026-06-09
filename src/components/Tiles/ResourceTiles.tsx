import { memo, useMemo } from "react";
import dayjs from "dayjs";
import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";
import { dayStartHour } from "@/constants";
import { HourlyTile, Tile } from "@/components";
import { isProjectVisible } from "@/utils/scrollHelpers";
import { getDailyTileSegments, getWeeklyTileSegments } from "@/utils/getTileSegments";
import {
  getWorkingHoursForDate,
  isOccupancyProject,
  sortWorkingDurations
} from "@/utils/workingDurationHelper";
import { PlacedTiles, ResourceTilesComponent, ResourceTilesProps } from "./types";

const ResourceTilesInner = <TMeta,>({
  data,
  zoom,
  rows,
  onTileClick,
  visibleStart,
  visibleEnd,
  workingDurations,
  defaultStartHour
}: ResourceTilesProps<TMeta>) => {
  const visibleStartDay = dayjs(visibleStart).startOf("day").valueOf();
  const visibleEndDay = dayjs(visibleEnd).endOf("day").valueOf();

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

  const tiles = useMemo((): PlacedTiles => {
    const visibleStartDate = dayjs(visibleStart);
    const visibleEndDate = dayjs(visibleEnd);

    // Helper: Render hourly tiles for a single project
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
      const startHour = defaultStartHour ?? dayStartHour;

      while (currentDate.isBefore(iterationEndDay) || currentDate.isSame(iterationEndDay)) {
        const currentDateString = currentDate.format("YYYY-MM-DD");

        // Ensure if this project is on the same day as the previously rendered,
        // it starts after the previous project ends
        const currentStartTime =
          startDateTimes[currentDateString] || currentDate.startOf("day").hour(startHour);

        let currentEndTime = currentStartTime;
        if (isOccupancyProject(project)) {
          currentEndTime = currentStartTime.add(project.occupancy, "second");
        } else {
          const workingHours = hoursByDay.get(currentDate.startOf("day").valueOf()) ?? 0;
          currentEndTime = currentStartTime.add(workingHours * project.throughput, "hour");
        }

        startDateTimes[currentDateString] = currentEndTime;
        if (currentEndTime.isAfter(visibleEndDate)) {
          currentEndTime = visibleEndDate;
        }

        currentDate = currentDate.add(1, "day");

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
        .flat(3);
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
                ? getWeeklyTileSegments(project, visibleStart, visibleEnd, hoursByDay)
                : getDailyTileSegments(project, visibleStart, visibleEnd, hoursByDay);

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
      .flat(3);
  }, [visibleStart, visibleEnd, zoom, data, defaultStartHour, hoursByDay, onTileClick, rows]);

  return <>{tiles}</>;
};

const ResourceTiles = memo(ResourceTilesInner) as ResourceTilesComponent;

export default ResourceTiles;
