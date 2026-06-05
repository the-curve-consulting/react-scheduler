import { memo } from "react";
import ResourceTiles from "./ResourceTiles";
import { TilesComponent, TilesProps } from "./types";

const TilesInner = <TMeta,>({
  data,
  zoom,
  onTileClick,
  visibleRange,
  workingDurationsPerPerson,
  defaultStartHour
}: TilesProps<TMeta>) => {
  let rows = 0;
  const visibleStart = visibleRange.startDate.valueOf();
  const visibleEnd = visibleRange.endDate.valueOf();

  const calculateRowOffset = (personIndex: number, currentRows: number): number => {
    if (personIndex === 0) return currentRows;
    return currentRows + Math.max(data[personIndex - 1].data.length, 1);
  };

  return data.map((person, personIndex) => {
    rows = calculateRowOffset(personIndex, rows);

    return (
      <ResourceTiles
        key={person.id}
        zoom={zoom}
        data={person.data}
        rows={rows}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        workingDurations={workingDurationsPerPerson[personIndex]}
        onTileClick={onTileClick}
        defaultStartHour={defaultStartHour}
      />
    );
  });
};

const Tiles = memo(TilesInner) as TilesComponent;

export default Tiles;
