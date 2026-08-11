import styled, { css } from "styled-components";
import { navHeight } from "@/constants";

/**
 * Exactly `navHeight` tall, because the outline column and any host-side task
 * grid clear the toolbar and the ruler by that combined height to line their
 * rows up with the bars. Changing this silently knocks both out of alignment.
 */
export const StyledToolbar = styled.div<{ $width: number }>`
  /* The chart column is as wide as the whole virtual timeline, so an ordinary
     block child would sit at the far left of it and scroll out of view. Pinned
     and given an explicit width, exactly as the Header's own topbar is. */
  position: sticky;
  left: 0;
  z-index: 3;
  width: ${({ $width }) => ($width > 0 ? `${$width}px` : "100%")};
  display: flex;
  align-items: center;
  gap: 12px;
  height: ${navHeight}px;
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
`;

export const StyledGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const StyledSpacer = styled.div`
  flex: 1;
`;

const controlBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent}33;
  }
`;

export const StyledNavButton = styled.button`
  ${controlBase};
  width: 28px;
  color: ${({ theme }) => theme.colors.placeholder};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const StyledTodayButton = styled.button`
  ${controlBase};
  padding: 0 10px;
  font-weight: 500;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const StyledRange = styled.span`
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/**
 * Named zoom levels rather than a `-`/`+` pair: "View +" does not tell you
 * whether you are about to see weeks or hours.
 */
export const StyledSegmentedControl = styled.div`
  display: inline-flex;
  padding: 2px;
  gap: 2px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.primary};
`;

export const StyledSegment = styled.button<{ $active: boolean }>`
  ${controlBase};
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;

  ${({ $active, theme }) =>
    $active
      ? css`
          background: ${theme.colors.background};
          color: ${theme.colors.textPrimary};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);

          &:hover {
            background: ${theme.colors.background};
          }
        `
      : css`
          color: ${theme.colors.placeholder};
        `}
`;

export const StyledThemeButton = styled.button`
  ${controlBase};
  width: 28px;
  color: ${({ theme }) => theme.colors.placeholder};
`;
