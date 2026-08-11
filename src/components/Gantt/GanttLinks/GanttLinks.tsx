import { useMemo } from "react";
import dayjs from "dayjs";
import styled, { useTheme } from "styled-components";
import { GanttLink, GanttRow } from "@/types/gantt";
import { getArrowHead, getBarGeometry, getLinkPath } from "../geometry";

const StyledLinkLayer = styled.svg`
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
`;

const StyledPath = styled.path<{ $colour: string }>`
  fill: none;
  stroke: ${({ $colour }) => $colour};
  stroke-width: 1.5;
`;

const StyledHead = styled.path<{ $colour: string }>`
  fill: ${({ $colour }) => $colour};
`;

export type GanttLinksProps<TMeta = unknown> = {
  rows: Array<GanttRow<TMeta>>;
  links: Array<GanttLink>;
  currentCenterDate: dayjs.Dayjs;
  zoom: number;
  cols: number;
  width: number;
  height: number;
};

export const GanttLinks = <TMeta,>({
  rows,
  links,
  currentCenterDate,
  zoom,
  cols,
  width,
  height
}: GanttLinksProps<TMeta>) => {
  const theme = useTheme();

  const paths = useMemo(() => {
    const rowByTaskId = new Map(rows.map((row) => [row.task.id, row]));

    return links.flatMap((link) => {
      const from = rowByTaskId.get(link.predecessorId);
      const to = rowByTaskId.get(link.successorId);
      // Either end may be hidden under a collapsed parent, or simply absent
      // from the data. An arrow to nowhere is worse than no arrow.
      if (!from || !to) return [];

      const kind = link.kind ?? "finish_to_start";
      const fromGeometry = getBarGeometry(
        from.index,
        from.task.startDate,
        from.task.endDate,
        currentCenterDate,
        zoom,
        cols
      );
      const toGeometry = getBarGeometry(
        to.index,
        to.task.startDate,
        to.task.endDate,
        currentCenterDate,
        zoom,
        cols
      );

      return [
        {
          id: link.id,
          path: getLinkPath(fromGeometry, toGeometry, kind),
          head: getArrowHead(toGeometry, kind)
        }
      ];
    });
  }, [links, rows, currentCenterDate, zoom, cols]);

  return (
    <StyledLinkLayer width={width} height={height}>
      {paths.map((entry) => (
        <g key={entry.id}>
          <StyledPath d={entry.path} $colour={theme.colors.disabled} />
          <StyledHead d={entry.head} $colour={theme.colors.disabled} />
        </g>
      ))}
    </StyledLinkLayer>
  );
};

export default GanttLinks;
