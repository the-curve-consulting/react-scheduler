import styled from "styled-components";
import { headerHeight } from "@/constants";

export const StyledOuterWrapper = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
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
