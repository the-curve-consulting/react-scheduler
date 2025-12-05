import { FC, memo, useMemo } from "react";
import dayjs from "dayjs";
import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";
import { getDatesRange } from "@/utils/getDatesRange";
import { dayStartHour } from "@/constants";
import { Tile, HourlyTile } from "..";
import { PlacedTiles, TilesProps } from "./types";

const Tiles: FC<TilesProps> = ({ data, zoom, onTileClick, date, defaultStartHour }) => {
  const datesRange = useMemo(() => getDatesRange(date, zoom), [date, zoom]);

  const tiles = useMemo((): PlacedTiles => {
    // Helper: Calculate row offset based on previous person's data
    const calculateRowOffset = (personIndex: number, currentRows: number): number => {
      if (personIndex === 0) return currentRows;
      return currentRows + Math.max(data[personIndex - 1].data.length, 1);
    };

    // Helper: Render hourly tiles for a single project
    const renderHourlyTilesForProject = (
      project: SchedulerProjectData,
      rowIndex: number,
      rowOffset: number,
      startDateTimes: Record<string, dayjs.Dayjs>
    ): PlacedTiles => {
      const tilesPerProject: PlacedTiles = [];
      let currentDate = dayjs(project.startDate);
      const finalDate = dayjs(project.endDate);
      const startHour = defaultStartHour ?? dayStartHour;

      while (currentDate.isBefore(finalDate) || currentDate.isSame(finalDate, "day")) {
        const currentDateString = currentDate.format("YYYY-MM-DD");

        // Ensure if this project is on the same day as the previously rendered,
        // it starts after the previous project ends
        const currentStartTime =
          startDateTimes[currentDateString] || currentDate.hour(startHour).minute(0);
        const currentEndTime = currentStartTime.add(project.occupancy, "second");
        startDateTimes[currentDateString] = currentEndTime;

        currentDate = currentDate.add(1, "day");

        // Skip tiles outside the visible date range to avoid unnecessary rendering
        if (
          currentStartTime.isAfter(currentEndTime) ||
          currentEndTime.isBefore(datesRange.startDate)
        ) {
          continue;
        }

        const dayData: SchedulerProjectDayData = {
          data: project,
          startDateTime: currentStartTime,
          endDateTime: currentEndTime
        };

        tilesPerProject.push(
          <HourlyTile
            key={`${project.id}-${currentDateString}`}
            row={rowIndex + rowOffset}
            dayData={dayData}
            datesRange={datesRange}
            onTileClick={onTileClick}
          />
        );
      }

      return tilesPerProject;
    };

    let rows = 0;

    if (zoom === 2) {
      // Hourly view
      return data
        .map((person, personIndex) => {
          rows = calculateRowOffset(personIndex, rows);

          // Note: The projectsPerRow is ensured that no projects overlap on the same day
          const startDateTimes: Record<string, dayjs.Dayjs> = {};
          return person.data.map((projectsPerRow, rowIndex) =>
            projectsPerRow.map((project) =>
              renderHourlyTilesForProject(project, rowIndex, rows, startDateTimes)
            )
          );
        })
        .flat(3);
    }

    // Regular view
    return data
      .map((person, personIndex) => {
        rows = calculateRowOffset(personIndex, rows);
        return person.data.map((projectsPerRow, rowIndex) =>
          projectsPerRow.map((project) => (
            <Tile
              key={project.id}
              row={rowIndex + rows}
              data={project}
              datesRange={datesRange}
              zoom={zoom}
              onTileClick={onTileClick}
            />
          ))
        );
      })
      .flat(2);
  }, [data, zoom, datesRange, onTileClick, defaultStartHour]);

  return <>{tiles}</>;
};

export default memo(Tiles);
