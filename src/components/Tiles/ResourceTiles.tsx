import { memo, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { HourlyTile, Tile, HolidayTile } from "@/components";
import { getDailyTileSegments, getWeeklyTileSegments } from "@/utils/getTileSegments";
import { getHolidayRequestsForDateRange } from "@/utils/holidayRequestHelper";
import { SchedulerProjectData } from "@/types/global";
import {
  ActiveTileGesture,
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

/**
 * The dates to draw, which during a drag are the ones the pointer is over.
 *
 * The preview goes through the same layout as the stored dates, so the days
 * off inside the bar follow the block as the user drags it.
 */
const previewProject = <TMeta,>(
  project: SchedulerProjectData<TMeta>,
  tileGesture: ActiveTileGesture | null | undefined
): SchedulerProjectData<TMeta> => {
  if (!tileGesture || tileGesture.groupId !== (project.groupId ?? project.id)) return project;
  if (tileGesture.days === 0) return project;

  const shift = (date: Date) => dayjs(date).add(tileGesture.days, "day").toDate();
  const startDate =
    tileGesture.reason === "resize-end" ? project.startDate : shift(project.startDate);
  const endDate = tileGesture.reason === "resize-start" ? project.endDate : shift(project.endDate);

  // A resize that would invert the bar is a mis-drag, so the preview holds at
  // one day rather than disappearing.
  if (dayjs(endDate).isBefore(startDate, "day")) {
    return tileGesture.reason === "resize-start"
      ? { ...project, startDate: endDate, endDate }
      : { ...project, startDate, endDate: startDate };
  }

  return { ...project, startDate, endDate };
};

const getRangeResourceTiles = <TMeta,>({
  visibleLayoutResource,
  zoom,
  rowOffset,
  visibleRange,
  onTileClick,
  tileGesture,
  onTileGestureStart
}: RangeResourceTilesProps<TMeta>): PlacedTiles =>
  visibleLayoutResource.visibleProjectRows.flatMap((projectsPerRow, rowIndex) =>
    projectsPerRow.flatMap((storedProject) => {
      const project = previewProject(storedProject, tileGesture);
      const dragging = tileGesture?.groupId === (project.groupId ?? project.id);
      const segments =
        zoom === 0
          ? getWeeklyTileSegments(project, visibleRange, visibleLayoutResource.dayContextsByDay)
          : getDailyTileSegments(project, visibleRange, visibleLayoutResource.dayContextsByDay);

      return segments.map((segment, segmentIndex) => (
        <Tile
          key={`${project.id}-${segmentIndex}`}
          row={rowIndex + rowOffset}
          data={segment.data}
          startDate={segment.startDate}
          endDate={segment.endDate}
          working={segment.working}
          nonWorkingRuns={segment.nonWorkingRuns}
          zoom={zoom}
          dragging={dragging}
          onTileClick={onTileClick}
          onGestureStart={
            onTileGestureStart &&
            ((event, reason) =>
              onTileGestureStart(event, storedProject, visibleLayoutResource.resourceId, reason))
          }
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
  visibleRange,
  tileGesture,
  onTileGestureStart
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
        onTileClick,
        tileGesture,
        onTileGestureStart
      }).concat(holidayTiles);
  }
};

const ResourceTiles = memo(ResourceTilesInner) as ResourceTilesComponent;

export default ResourceTiles;
