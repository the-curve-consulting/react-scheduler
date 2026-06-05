import { memo, useMemo } from "react";
import dayjs from "dayjs";
import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";
import { dayStartHour } from "@/constants";
import { HourlyTile, Tile } from "@/components";
import { isProjectVisible } from "@/utils/scrollHelpers";
import {
  getWorkingDurationsForDateRange,
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

  const relevantWorkingDurations = useMemo(
    () =>
      getWorkingDurationsForDateRange(
        dayjs(visibleStartDay),
        dayjs(visibleEndDay),
        sortedWorkingDurations
      ),
    [sortedWorkingDurations, visibleStartDay, visibleEndDay]
  );

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
          const workingHours = getWorkingHoursForDate(currentDate, relevantWorkingDurations);
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
          .map((project) => (
            //TODO [Jakub] Implement "not working" separators based on working days
            <Tile
              key={project.id}
              row={rowIndex + rows}
              data={project}
              zoom={zoom}
              onTileClick={onTileClick}
            />
          ))
      )
      .flat(2);
  }, [
    visibleStart,
    visibleEnd,
    zoom,
    data,
    defaultStartHour,
    onTileClick,
    relevantWorkingDurations,
    rows
  ]);

  return <>{tiles}</>;
};

const ResourceTiles = memo(ResourceTilesInner) as ResourceTilesComponent;

export default ResourceTiles;
