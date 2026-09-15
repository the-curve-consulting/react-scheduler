import { memo, type MouseEvent } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { getTintedHolidayTileStyle } from "@/utils/getTintedTileStyle";
import { useCalendar } from "@/context/CalendarProvider";
import { tileHeight, tileYOffset } from "@/constants";
import { getCellDateRelativeToCenter } from "@/utils/scrollHelpers";
import {
  StyledHolidayText,
  StyledStickyWrapper,
  StyledTextWrapper,
  StyledTileWrapper,
  tileTextHorizontalMargin,
  tintedTileInset
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
  const theme = useTheme();
  const { colors } = theme;
  const isTinted = theme.tileStyle === "tinted";
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
      $tinted={isTinted}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${
          rowNo * (tileHeight + 2 * tileYOffset) -
          2 * tileYOffset -
          (isTinted ? 2 * tintedTileInset : 0)
        }px`,
        ...(isTinted
          ? getTintedHolidayTileStyle(theme)
          : { backgroundColor: colors.holidayTile, color: getTileTextColor(colors.holidayTile) })
      }}
      onClick={handleTileClick}>
      <StyledTextWrapper $tinted={isTinted}>
        <StyledStickyWrapper $offset={textOffset}>
          <StyledHolidayText bold>Holiday ...</StyledHolidayText>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const HolidayTile = memo(HolidayTileInner) as HolidayTileComponent;

export default HolidayTile;
