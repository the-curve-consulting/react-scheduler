import styled from "styled-components";
import { headerHeight } from "@/constants";

export const StyledOuterWrapper = styled.div<{ $stickyTop: number }>`
  position: sticky;
  top: ${({ $stickyTop }) => $stickyTop}px;
  left: 0;
  z-index: 2;
`;

export const StyledWrapper = styled.div<{ $viewportWidth: number; $leftColumnWidth: number }>`
  position: sticky;
  left: ${(props) => props.$leftColumnWidth}px;
  width: ${({ $viewportWidth }) => $viewportWidth}px;
  height: ${headerHeight}px;
  display: block;
  overflow: hidden;
`;

export const StyledCanvas = styled.canvas``;
