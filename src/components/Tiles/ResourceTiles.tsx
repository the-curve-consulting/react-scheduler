import { memo, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { HourlyTile, Tile, HolidayTile } from "@/components";
import { getDailyTileSegments, getWeeklyTileSegments } from "@/utils/getTileSegments";
import { getHolidayRequestsForDateRange } from "@/utils/holidayRequestHelper";
import {
  HourlyResourceTilesProps,
  PlacedTiles,
  RangeResourceTilesProps,
  ResourceTilesComponent,
  ResourceTilesProps
} from "./types";

const getHourlyResourceTiles = <TMeta,>({
  visibleLayoutResource,
  rowOffset,
  onTileClick
}: HourlyResourceTilesProps<TMeta>): PlacedTiles =>
  visibleLayoutResource.visibleHourlyPlacements.map((placement) => (
    <HourlyTile
      key={`${placement.project.id}-${placement.startDateTime}`}
      row={placement.rowIndex + rowOffset}
      dayData={{
        startDateTime: placement.startDateTime,
        endDateTime: placement.endDateTime,
        data: placement.project
      }}
      onTileClick={onTileClick}
    />
  ));

const getRangeResourceTiles = <TMeta,>({
  visibleLayoutResource,
  zoom,
  rowOffset,
  visibleRange,
  onTileClick
}: RangeResourceTilesProps<TMeta>): PlacedTiles =>
  visibleLayoutResource.visibleProjectRows.flatMap((projectsPerRow, rowIndex) =>
    projectsPerRow.flatMap((project) => {
      const segments =
        zoom === 0
          ? getWeeklyTileSegments(project, visibleRange, visibleLayoutResource.dayContextsByDay)
          : getDailyTileSegments(project, visibleRange, visibleLayoutResource.dayContextsByDay);

      return segments.map((segment) => (
        <Tile
          key={`${project.id}-${segment.startDate.valueOf()}-${segment.endDate.valueOf()}-${
            segment.working
          }`}
          row={rowIndex + rowOffset}
          data={segment.data}
          startDate={segment.startDate}
          endDate={segment.endDate}
          working={segment.working}
          nonWorkingRuns={segment.nonWorkingRuns}
          zoom={zoom}
          onTileClick={onTileClick}
        />
      ));
    })
  );

const ResourceTilesInner = <TMeta,>({
  visibleLayoutResource,
  zoom,
  rowOffset,
  onTileClick,
  onHolidayTileClick,
  visibleRange
}: ResourceTilesProps<TMeta>) => {
  const visibleHolidayRequests = useMemo(
    () => visibleLayoutResource.holidayPlacements.map(({ holidayRequest }) => holidayRequest),
    [visibleLayoutResource.holidayPlacements]
  );

  const handleHolidayTileClick = useCallback(
    (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
      const parsedStartDate = startDate.toDate();
      const parsedEndDate = endDate.toDate();

      onHolidayTileClick?.({
        resourceId: visibleLayoutResource.resourceId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        holidayRequests: getHolidayRequestsForDateRange(startDate, endDate, visibleHolidayRequests)
      });
    },
    [visibleHolidayRequests, onHolidayTileClick, visibleLayoutResource.resourceId]
  );

  const holidayTiles: PlacedTiles = useMemo(
    () =>
      visibleLayoutResource.holidayPlacements.map((placement) => (
        <HolidayTile
          key={placement.holidayRequest.id}
          rowIndex={rowOffset}
          rowNo={visibleLayoutResource.visibleRowsCount}
          startDate={placement.startDate}
          endDate={placement.endDate}
          zoom={zoom}
          onTileClick={handleHolidayTileClick}
        />
      )),
    [
      handleHolidayTileClick,
      rowOffset,
      visibleLayoutResource.holidayPlacements,
      visibleLayoutResource.visibleRowsCount,
      zoom
    ]
  );

  switch (visibleLayoutResource.mode) {
    case "hourly":
      return getHourlyResourceTiles({ visibleLayoutResource, rowOffset, onTileClick }).concat(
        holidayTiles
      );
    case "range":
      return getRangeResourceTiles({
        visibleLayoutResource,
        zoom,
        rowOffset,
        visibleRange,
        onTileClick
      }).concat(holidayTiles);
  }
};

const ResourceTiles = memo(ResourceTilesInner) as ResourceTilesComponent;

export default ResourceTiles;
