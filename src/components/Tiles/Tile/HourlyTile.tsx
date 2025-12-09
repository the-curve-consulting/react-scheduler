import { FC, memo } from "react";
import { useTheme } from "styled-components";
import { getHourlyTileProperties } from "@/utils/getHourlyTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import {
  StyledDescription,
  StyledStickyWrapper,
  StyledText,
  StyledTextWrapper,
  StyledTileWrapper
} from "./styles";
import { HourlyTileProps } from "./types";

const HourlyTile: FC<HourlyTileProps> = ({ row, dayData, datesRange, onTileClick }) => {
  const { y, x, width } = getHourlyTileProperties(
    row,
    datesRange.startDate,
    datesRange.endDate,
    dayData.startDateTime,
    dayData.endDateTime
  );

  const { colors } = useTheme();

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
        <StyledStickyWrapper>
          <StyledText bold>{dayData.data.title}</StyledText>
          <StyledText>{dayData.data.subtitle}</StyledText>
          <StyledDescription>{dayData.data.description}</StyledDescription>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

export default memo(HourlyTile);
