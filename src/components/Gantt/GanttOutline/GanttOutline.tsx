import styled from "styled-components";
import { boxHeight, headerHeight, navHeight } from "@/constants";
import { GanttRow, GanttTask } from "@/types/gantt";

const StyledWrapper = styled.div<{ $width: number }>`
  position: sticky;
  left: 0;
  z-index: 2;
  flex-shrink: 0;
  width: ${({ $width }) => $width}px;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

// The chart column stacks the topbar above the ruler, so the outline's own
// header has to be as tall as both for the rows to line up with the bars.
const StyledHeader = styled.div`
  display: flex;
  align-items: flex-end;
  height: ${navHeight + headerHeight}px;
  padding: 0 12px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.placeholder};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-sizing: border-box;
`;

const StyledRow = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: 4px;
  height: ${boxHeight}px;
  padding-right: 12px;
  padding-left: ${({ $depth }) => 12 + $depth * 16}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.primary};
  box-sizing: border-box;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }
`;

const StyledToggle = styled.button<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.placeholder};

  &::before {
    content: "";
    width: 0;
    height: 0;
    border-left: 4px solid currentColor;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    transform: rotate(${({ $collapsed }) => ($collapsed ? "0deg" : "90deg")});
    transition: transform 120ms ease;
  }
`;

/** Keeps a leaf's text aligned with its siblings that do have a toggle. */
const StyledToggleSpacer = styled.span`
  display: inline-block;
  width: 16px;
  flex-shrink: 0;
`;

const StyledTitle = styled.span<{ $summary: boolean }>`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: ${({ $summary }) => ($summary ? 600 : 400)};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const StyledSubtitle = styled.span`
  font-size: 11px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.placeholder};
`;

export type GanttOutlineProps<TMeta = unknown> = {
  rows: Array<GanttRow<TMeta>>;
  width: number;
  label?: string;
  onToggle: (id: string) => void;
  onTaskClick?: (task: GanttTask<TMeta>) => void;
};

/**
 * The task tree beside the chart.
 *
 * It is deliberately read-only: a host that wants an editable grid — inline
 * names, durations, assignees — should set `outlineWidth: 0` and render its own
 * beside the chart. Owning a spreadsheet is not this component's job.
 */
export const GanttOutline = <TMeta,>({
  rows,
  width,
  label = "Task",
  onToggle,
  onTaskClick
}: GanttOutlineProps<TMeta>) => (
  <StyledWrapper $width={width}>
    <StyledHeader>{label}</StyledHeader>
    {rows.map((row) => (
      <StyledRow key={row.task.id} $depth={row.depth} onClick={() => onTaskClick?.(row.task)}>
        {row.hasChildren ? (
          <StyledToggle
            type="button"
            $collapsed={row.collapsed}
            aria-label={row.collapsed ? "Expand" : "Collapse"}
            aria-expanded={!row.collapsed}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(row.task.id);
            }}
          />
        ) : (
          <StyledToggleSpacer />
        )}
        <StyledTitle $summary={row.hasChildren}>{row.task.title}</StyledTitle>
        {row.task.subtitle && <StyledSubtitle>{row.task.subtitle}</StyledSubtitle>}
      </StyledRow>
    ))}
  </StyledWrapper>
);

export default GanttOutline;
