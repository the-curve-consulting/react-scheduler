import { FC, memo } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { useCalendar } from "@/context/CalendarProvider";
import {
  StyledDescription,
  StyledStickyWrapper,
  StyledText,
  StyledTextWrapper,
  StyledTileWrapper
} from "./styles";
import { TileProps } from "./types";

const Tile: FC<TileProps> = ({ row, data, zoom, onTileClick }) => {
  const { currentCenterDate, viewportWidth } = useCalendar();
  const { y, x, width } = getTileProperties(row, data, currentCenterDate, zoom, viewportWidth);
  const { colors } = useTheme();

  return (
    <StyledTileWrapper
      style={{
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: `${data.bgColor ?? colors.defaultTile}`,
        width: `${width}px`,
        color: getTileTextColor(data.bgColor ?? "")
      }}
      onClick={() => onTileClick?.(data)}>
      <StyledTextWrapper>
        <StyledStickyWrapper>
          <StyledText bold>{data.title}</StyledText>
          <StyledText>{data.subtitle}</StyledText>
          <StyledDescription>{data.description}</StyledDescription>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

export default memo(Tile);
