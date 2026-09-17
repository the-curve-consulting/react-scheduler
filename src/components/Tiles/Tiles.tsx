import { memo } from "react";
import { getResourceRowRanges } from "@/utils/getResourceRowRanges";
import ResourceTiles from "./ResourceTiles";
import { TilesComponent, TilesProps } from "./types";

const TilesInner = <TMeta,>({
  visibleLayoutsPerResource,
  zoom,
  onTileClick,
  onHolidayTileClick,
  visibleRange,
  tileGesture,
  onTileGestureStart
}: TilesProps<TMeta>) => {
  const rowRanges = getResourceRowRanges(visibleLayoutsPerResource);

  return visibleLayoutsPerResource.map((visibleLayout, resourceIndex) => (
    <ResourceTiles
      key={visibleLayout.resourceId}
      visibleLayoutResource={visibleLayout}
      zoom={zoom}
      rowOffset={rowRanges[resourceIndex].startRow}
      visibleRange={visibleRange}
      onTileClick={onTileClick}
      onHolidayTileClick={onHolidayTileClick}
      tileGesture={tileGesture}
      onTileGestureStart={onTileGestureStart}
    />
  ));
};

const Tiles = memo(TilesInner) as TilesComponent;

export default Tiles;
