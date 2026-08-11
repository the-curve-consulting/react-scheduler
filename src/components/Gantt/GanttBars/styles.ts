import styled from "styled-components";
import { ganttBarHeight } from "../geometry";

export const StyledBarsLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

export const StyledBar = styled.div<{ $editable: boolean; $dragging: boolean }>`
  position: absolute;
  height: ${ganttBarHeight}px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  pointer-events: auto;
  cursor: ${({ $editable }) => ($editable ? "grab" : "pointer")};
  /* A bar being dragged must not animate towards the cursor, or it lags it. */
  transition: ${({ $dragging }) => ($dragging ? "none" : "box-shadow 120ms ease")};
  box-shadow: ${({ $dragging }) => ($dragging ? "0 4px 12px rgba(0, 0, 0, 0.25)" : "none")};

  &:hover {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }
`;

/** The done portion, drawn darker inside the bar rather than as a second bar. */
export const StyledProgress = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: none;
`;

export const StyledBarLabel = styled.span<{ $color: string }>`
  position: relative;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ $color }) => $color};
  pointer-events: none;
`;

/** Shown beside a bar too narrow to hold its own label. */
export const StyledOutsideLabel = styled.span`
  position: absolute;
  font-size: 11px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
  pointer-events: none;
`;

export const StyledResizeHandle = styled.div<{ $edge: "start" | "end" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  ${({ $edge }) => ($edge === "start" ? "left: 0;" : "right: 0;")}
  cursor: ew-resize;
  pointer-events: auto;
  opacity: 0;
  background: rgba(255, 255, 255, 0.6);

  ${StyledBar}:hover & {
    opacity: 1;
  }
`;

/**
 * A summary task is a bracket, not a bar: its span is the consequence of its
 * children, and drawing it like a bar invites someone to drag it.
 */
export const StyledSummary = styled.div`
  position: absolute;
  height: 10px;
  pointer-events: auto;
  cursor: pointer;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    width: 8px;
    height: 10px;
    background: inherit;
  }

  &::before {
    left: 0;
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }

  &::after {
    right: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }
`;

export const StyledSummaryBody = styled.div`
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: inherit;
`;

export const StyledMilestone = styled.div<{ $size: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  transform: rotate(45deg);
  border-radius: 2px;
  pointer-events: auto;
  cursor: pointer;
`;

/** A ghost of the baselined dates, sitting under the live bar. */
export const StyledBaseline = styled.div`
  position: absolute;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.border};
  pointer-events: none;
`;

export const StyledAssignees = styled.span`
  position: absolute;
  display: flex;
  gap: 2px;
  pointer-events: none;
`;

export const StyledAvatar = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 600;
  color: #ffffff;
  background: ${({ $color }) => $color};
`;
