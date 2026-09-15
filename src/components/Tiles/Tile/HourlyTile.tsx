import { memo } from "react";
import { useTheme } from "styled-components";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { getTintedTileStyle } from "@/utils/getTintedTileStyle";
import { useCalendar } from "@/context/CalendarProvider";
import { getTileProperties } from "@/utils/getTileProperties";
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
import { HourlyTileComponent, HourlyTileProps } from "./types";

const HourlyTileInner = <TMeta,>({ row, dayData, onTileClick }: HourlyTileProps<TMeta>) => {
  const { currentCenterDate, cols } = useCalendar<TMeta>();
  const { y, x, width } = getTileProperties(
    row,
    dayData.startDateTime,
    dayData.endDateTime,
    currentCenterDate,
    2,
    cols,
    true
  );

  const theme = useTheme();
  const { colors } = theme;
  const isTinted = theme.tileStyle === "tinted";
  const colorStyle = isTinted
    ? getTintedTileStyle(dayData.data.bgColor ?? colors.defaultTile, true, theme)
    : {
        backgroundColor: `${dayData.data.bgColor ?? colors.defaultTile}`,
        color: getTileTextColor(dayData.data.bgColor ?? "")
      };
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
      onClick={() => onTileClick?.(dayData.data)}>
      <StyledTextWrapper $tinted={isTinted}>
        <StyledStickyWrapper $offset={textOffset}>
          {isTinted ? (
            <>
              <StyledTintedTitle>{dayData.data.title}</StyledTintedTitle>
              {dayData.data.subtitle && width >= tintedTileMinWidthForSubtitle && (
                <StyledTintedSubtitle>{dayData.data.subtitle}</StyledTintedSubtitle>
              )}
            </>
          ) : (
            <>
              <StyledText bold>{dayData.data.title}</StyledText>
              <StyledText>{dayData.data.subtitle}</StyledText>
              <StyledDescription>{dayData.data.description}</StyledDescription>
            </>
          )}
        </StyledStickyWrapper>
      </StyledTextWrapper>
    </StyledTileWrapper>
  );
};

const HourlyTile = memo(HourlyTileInner) as HourlyTileComponent;

export default HourlyTile;
