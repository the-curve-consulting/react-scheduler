import styled from "styled-components";

export const StyledWrapper = styled.div<{ $virtualWidth: number }>`
  width: ${({ $virtualWidth }) => $virtualWidth}px;
  height: 100%;
  position: relative;
  z-index: 1;
`;

export const StyledInnerWrapper = styled.div<{ $viewportWidth: number; $leftColumnWidth: number }>`
  position: sticky;
  left: ${(props) => props.$leftColumnWidth}px;
  width: ${(props) => props.$viewportWidth}px;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

export const StyledCanvas = styled.canvas``;
