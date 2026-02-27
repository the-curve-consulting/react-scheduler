import styled, { keyframes } from "styled-components";

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

export const StyledTilesLayer = styled.div<{ $isInteractive: boolean }>`
  pointer-events: ${({ $isInteractive }) => ($isInteractive ? "auto" : "none")};
`;

const pulse = keyframes`
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.35;
  }
`;

export const StyledBlockingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.45);
  z-index: 2;
  pointer-events: none;
`;

export const StyledBlockingContent = styled.div`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.secondary};
  animation: ${pulse} 1.2s ease-in-out infinite;
`;
