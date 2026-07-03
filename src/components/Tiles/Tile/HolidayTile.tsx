import { memo, type MouseEvent } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { useCalendar } from "@/context/CalendarProvider";
import { tileHeight, tileYOffset } from "@/constants";
import { getCellDateRelativeToCenter } from "@/utils/scrollHelpers";
import {
  StyledHolidayText,
  StyledStickyWrapper,
  StyledTextWrapper,
  StyledTileWrapper,
  tileTextHorizontalMargin
} from "./styles";
import { HolidayTileComponent, HolidayTileProps } from "./types";

const HolidayTileInner = <TMeta,>({
  rowIndex,
  rowNo,
  zoom,
  startDate,
  endDate,
  onTileClick
}: HolidayTileProps) => {
  const { colors } = useTheme();
  const { currentCenterDate, cols } = useCalendar<TMeta>();
  const { y, x, width } = getTileProperties(
    rowIndex,
    startDate,
    endDate,
    currentCenterDate,
    zoom,
    cols,
    false,
    true
  );
  const maxTextOffset = Math.max(width - tileTextHorizontalMargin * 2, 0);
  const textOffset = Math.min(Math.max(0, -x), maxTextOffset);

  const handleTileClick = (event: MouseEvent<HTMLButtonElement>) => {
    const tileRect = event.currentTarget.getBoundingClientRect();
    const clickedX = x + event.clientX - tileRect.left;
    const { cellDate } = getCellDateRelativeToCenter(clickedX, currentCenterDate, zoom, cols);

    if (zoom === 0) {
      onTileClick?.(cellDate.startOf("isoWeek"), cellDate.endOf("isoWeek"));
      return;
    }

    const clickedDay = cellDate.startOf("day");
    onTileClick?.(clickedDay, clickedDay.endOf("day"));
  };

  return (
    <StyledTileWrapper
      style={{
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: colors.holidayTile,
        width: `${width}px`,
        height: `${rowNo * (tileHeight + 2 * tileYOffset) - 2 * tileYOffset}px`,
        color: getTileTextColor(colors.holidayTile)
      }}
      onClick={handleTileClick}>
      <StyledTextWrapper>
        <StyledStickyWrapper $offset={textOffset}>
          <StyledHolidayText bold>Holiday ...</StyledHolidayText>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const HolidayTile = memo(HolidayTileInner) as HolidayTileComponent;

export default HolidayTile;
