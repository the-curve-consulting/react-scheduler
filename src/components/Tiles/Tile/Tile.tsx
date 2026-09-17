import { memo } from "react";
import { useTheme } from "styled-components";
import { getTileProperties } from "@/utils/getTileProperties";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { getTintedTileStyle } from "@/utils/getTintedTileStyle";
import { useCalendar } from "@/context/CalendarProvider";
import {
  StyledDescription,
  StyledStickyWrapper,
  StyledText,
  StyledTextWrapper,
  StyledTileWrapper,
  StyledTintedSubtitle,
  StyledTintedTitle,
  tileTextHorizontalMargin,
  tintedTileMinWidthForSubtitle
} from "./styles";
import { TileComponent, TileProps } from "./types";

const TileInner = <TMeta,>({
  row,
  data,
  zoom,
  startDate,
  endDate,
  working,
  onTileClick
}: TileProps<TMeta>) => {
  const { currentCenterDate, cols } = useCalendar<TMeta>();
  const {
    y,
    x,
    width,
    working: isWorking
  } = getTileProperties(row, startDate, endDate, currentCenterDate, zoom, cols, working);
  const theme = useTheme();
  const { colors } = theme;
  const isTinted = theme.tileStyle === "tinted";
  const backgroundColor = isWorking ? data.bgColor ?? colors.defaultTile : colors.notWorkingTile;
  const colorStyle = isTinted
    ? getTintedTileStyle(data.bgColor ?? colors.defaultTile, isWorking, theme)
    : { backgroundColor, color: getTileTextColor(backgroundColor) };
  const maxTextOffset = Math.max(width - tileTextHorizontalMargin * 2, 0);
  const textOffset = Math.min(Math.max(0, -x), maxTextOffset);

  return (
    <StyledTileWrapper
      $tinted={isTinted}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        ...colorStyle
      }}
      onClick={() => onTileClick?.(data)}>
      <StyledTextWrapper $tinted={isTinted}>
        <StyledStickyWrapper $offset={textOffset}>
          {isTinted ? (
            isWorking && (
              <>
                <StyledTintedTitle>{data.title}</StyledTintedTitle>
                {data.subtitle && width >= tintedTileMinWidthForSubtitle && (
                  <StyledTintedSubtitle>{data.subtitle}</StyledTintedSubtitle>
                )}
              </>
            )
          ) : (
            <>
              <StyledText bold>{data.title}</StyledText>
              <StyledText>{isWorking ? data.subtitle : "Non-working day"}</StyledText>
              {isWorking && <StyledDescription>{data.description}</StyledDescription>}
            </>
          )}
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const Tile = memo(TileInner) as TileComponent;

export default Tile;
