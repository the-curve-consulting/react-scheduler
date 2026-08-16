import { memo } from "react";
import ResourceTiles from "./ResourceTiles";
import { TilesComponent, TilesProps } from "./types";

const TilesInner = <TMeta,>({
  visibleLayoutsPerResource,
  zoom,
  onTileClick,
  onHolidayTileClick,
  visibleRange
}: TilesProps<TMeta>) => {
  let rowOffset = 0;

  return visibleLayoutsPerResource.map((visibleLayout) => {
    const currentRowOffset = rowOffset;
    rowOffset += visibleLayout.visibleRowsCount;

    return (
      <ResourceTiles
        key={visibleLayout.resourceId}
        visibleLayoutResource={visibleLayout}
        zoom={zoom}
        rowOffset={currentRowOffset}
        visibleRange={visibleRange}
        onTileClick={onTileClick}
        onHolidayTileClick={onHolidayTileClick}
      />
    );
  });
};

const Tiles = memo(TilesInner) as TilesComponent;

export default Tiles;
