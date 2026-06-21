import { memo } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { useCalendar } from "@/context/CalendarProvider";
import { tileHeight, tileYOffset } from "@/constants";
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
  data,
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
    false
  );
  const maxTextOffset = Math.max(width - tileTextHorizontalMargin * 2, 0);
  const textOffset = Math.min(Math.max(0, -x), maxTextOffset);

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
      onClick={() => onTileClick?.(data)}>
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
