import { memo } from "react";
import { getResourceRowRanges } from "@/utils/getResourceRowRanges";
import ResourceTiles from "./ResourceTiles";
import { TilesComponent, TilesProps } from "./types";

const TilesInner = <TMeta,>({
  data,
  zoom,
  onTileClick,
  onHolidayTileClick,
  visibleRange,
  workingDurationsPerPerson,
  defaultStartHour,
  defaultWorkDayHours
}: TilesProps<TMeta>) => {
  const visibleStart = visibleRange.startDate.valueOf();
  const visibleEnd = visibleRange.endDate.valueOf();
  const rowRanges = getResourceRowRanges(data);

  return data.map((person, personIndex) => (
    <ResourceTiles
      key={person.id}
      resourceId={person.id}
      zoom={zoom}
      data={person.data}
      rows={rowRanges[personIndex].startRow}
      visibleStart={visibleStart}
      visibleEnd={visibleEnd}
      workingDurations={workingDurationsPerPerson[personIndex]}
      holidayRequests={person.holidayRequests}
      onTileClick={onTileClick}
      onHolidayTileClick={onHolidayTileClick}
      defaultStartHour={defaultStartHour}
      defaultWorkDayHours={defaultWorkDayHours}
    />
  ));
};

const Tiles = memo(TilesInner) as TilesComponent;

export default Tiles;
