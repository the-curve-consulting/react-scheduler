import styled from "styled-components";

export const StyledOutsideWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const StyledInnerWrapper = styled.div`
  display: flex;
  position: relative;
  width: fit-content;
  min-width: 100%;
`;

/** Holds the timeline's virtual width so the wrapper has something to scroll. */
export const StyledGridWrapper = styled.div<{ $virtualWidth: number }>`
  width: ${({ $virtualWidth }) => $virtualWidth}px;
  height: 100%;
  position: relative;
  z-index: 1;
`;

/**
 * Pinned beside the outline so the chart stays put while the virtual width
 * scrolls underneath it — the same trick <Grid> uses.
 */
export const StyledGridInnerWrapper = styled.div<{ $viewportWidth: number; $offset: number }>`
  position: sticky;
  left: ${({ $offset }) => $offset}px;
  width: ${({ $viewportWidth }) => $viewportWidth}px;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

export const StyledCanvas = styled.canvas`
  display: block;
`;

export const StyledChartColumn = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  min-width: 0;
`;

export const StyledEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.placeholder};
`;
