import { memo } from "react";
import { useTheme } from "styled-components";
import { getHourlyTileProperties } from "@/utils/getHourlyTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { useCalendar } from "@/context/CalendarProvider";
import {
  StyledDescription,
  StyledStickyWrapper,
  StyledText,
  StyledTextWrapper,
  StyledTileWrapper,
  tileTextHorizontalMargin
} from "./styles";
import { HourlyTileComponent, HourlyTileProps } from "./types";

const HourlyTileInner = <TMeta,>({ row, dayData, onTileClick }: HourlyTileProps<TMeta>) => {
  const { currentCenterDate, cols } = useCalendar<TMeta>();
  const { y, x, width } = getHourlyTileProperties(
    row,
    currentCenterDate,
    cols,
    dayData.startDateTime,
    dayData.endDateTime
  );

  const { colors } = useTheme();
  const maxTextOffset = Math.max(width - tileTextHorizontalMargin * 2, 0);
  const textOffset = Math.min(Math.max(0, -x), maxTextOffset);

  return (
    <StyledTileWrapper
      style={{
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: `${dayData.data.bgColor ?? colors.defaultTile}`,
        width: `${width}px`,
        color: getTileTextColor(dayData.data.bgColor ?? "")
      }}
      onClick={() => onTileClick?.(dayData.data)}>
      <StyledTextWrapper>
        <StyledStickyWrapper $offset={textOffset}>
          <StyledText bold>{dayData.data.title}</StyledText>
          <StyledText>{dayData.data.subtitle}</StyledText>
          <StyledDescription>{dayData.data.description}</StyledDescription>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const HourlyTile = memo(HourlyTileInner) as HourlyTileComponent;

export default HourlyTile;
