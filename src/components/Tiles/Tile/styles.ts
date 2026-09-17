import styled, { css } from "styled-components";
import { tileHeight } from "@/constants";
import { marginPaddingReset, truncate } from "@/styles";
import { StyledStickyWrapperProps, StyledTextProps, StyledTintedProps } from "./types";

export const tileTextHorizontalMargin = 16;
export const tintedTileInset = 4;
export const tintedTileMinWidthForSubtitle = 250;

export const StyledResizeHandle = styled.span<{ $edge: "start" | "end" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  ${({ $edge }) => ($edge === "start" ? "left: 0;" : "right: 0;")}
  cursor: ew-resize;
  z-index: 1;
`;

export const StyledTileWrapper = styled.button<StyledTintedProps>`
  ${marginPaddingReset}
  height: ${tileHeight}px;
  position: absolute;
  outline: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  cursor: ${({ $draggable }) => ($draggable ? "grab" : "pointer")};
  overflow: hidden;
  ${({ $dragging }) =>
    $dragging &&
    css`
      cursor: grabbing;
      opacity: 0.75;
    `}

  ${({ $tinted }) =>
    $tinted &&
    css`
      height: ${tileHeight - 2 * tintedTileInset}px;
      margin-top: ${tintedTileInset}px;
      border-radius: 6px;
    `}
`;

export const StyledTextWrapper = styled.div<StyledTintedProps>`
  margin: 10px ${tileTextHorizontalMargin}px;
  position: relative;
  display: flex;
  font-size: 10px;
  letter-spacing: 0.5px;
  line-height: 12px;
  overflow: hidden;

  ${({ $tinted }) =>
    $tinted &&
    css`
      margin: 12px ${tileTextHorizontalMargin}px;
      font-size: 12px;
      letter-spacing: 0;
      line-height: 16px;
    `}
`;

export const StyledText = styled.p<StyledTextProps>`
  ${marginPaddingReset}
  ${truncate}
  display: inline;
  font-weight: ${({ bold }) => (bold ? "600" : "400")};
  &:first-child {
    &::after {
      content: "|";
      margin: 0 3px;
    }
  }
`;

export const StyledTintedTitle = styled.p`
  ${marginPaddingReset}
  ${truncate}
  display: inline;
  font-weight: 600;
`;

export const StyledTintedSubtitle = styled.p`
  ${marginPaddingReset}
  ${truncate}
  display: inline;
  margin-left: 6px;
  color: ${({ theme }) => theme.colors.placeholder};
`;

export const StyledHolidayText = styled.p<StyledTextProps>`
  ${marginPaddingReset}
  ${truncate}
  display: inline;
  font-weight: ${({ bold }) => (bold ? "600" : "400")};
`;

export const StyledDescription = styled.p`
  ${marginPaddingReset}
  ${truncate}
`;

export const StyledStickyWrapper = styled.div<StyledStickyWrapperProps>`
  position: relative;
  transform: translateX(${({ $offset }) => $offset}px);
`;
