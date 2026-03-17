import { memo } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
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
import { TileComponent, TileProps } from "./types";

const TileInner = <TMeta,>({ row, data, zoom, onTileClick }: TileProps<TMeta>) => {
  const { currentCenterDate, cols } = useCalendar<TMeta>();
  const { y, x, width } = getTileProperties(row, data, currentCenterDate, zoom, cols);
  const { colors } = useTheme();
  const maxTextOffset = Math.max(width - tileTextHorizontalMargin * 2, 0);
  const textOffset = Math.min(Math.max(0, -x), maxTextOffset);

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
        <StyledStickyWrapper $offset={textOffset}>
          <StyledText bold>{data.title}</StyledText>
          <StyledText>{data.subtitle}</StyledText>
          <StyledDescription>{data.description}</StyledDescription>
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const Tile = memo(TileInner) as TileComponent;

export default Tile;
