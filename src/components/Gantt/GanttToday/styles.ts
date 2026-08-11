import styled from "styled-components";

/**
 * A hairline rather than a filled column: the marker has to stay legible where
 * it crosses a bar, and a translucent band tints every bar it touches into a
 * colour that means nothing.
 */
export const StyledTodayLine = styled.div<{ $x: number; $height: number }>`
  position: absolute;
  top: 0;
  left: ${({ $x }) => $x}px;
  width: 0;
  height: ${({ $height }) => $height}px;
  border-left: 1px dashed ${({ theme }) => theme.colors.accent};
  /* Under the bars: the line locates work in time, it does not obscure it. */
  z-index: 1;
  pointer-events: none;
`;

export const StyledTodayLabel = styled.span`
  position: absolute;
  top: 2px;
  left: 4px;
  padding: 1px 5px;
  border-radius: 0 4px 4px 0;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.accent};
`;
