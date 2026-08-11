import { useCallback, useState } from "react";
import dayjs from "dayjs";
import { useTheme } from "styled-components";
import { boxHeight } from "@/constants";
import { getTileTextColor } from "@/utils/getTileTextColor";
import { GanttRow, GanttTask, GanttTaskChange } from "@/types/gantt";
import {
  BarGeometry,
  ganttBarHeight,
  getBarGeometry,
  getPixelsPerDay,
  milestoneRadius
} from "../geometry";
import {
  StyledAssignees,
  StyledAvatar,
  StyledBar,
  StyledBarLabel,
  StyledBarsLayer,
  StyledBaseline,
  StyledMilestone,
  StyledOutsideLabel,
  StyledProgress,
  StyledResizeHandle,
  StyledSummary,
  StyledSummaryBody
} from "./styles";

type Gesture = {
  id: string;
  reason: GanttTaskChange["reason"];
  originX: number;
  days: number;
};

export type GanttBarsProps<TMeta = unknown> = {
  rows: Array<GanttRow<TMeta>>;
  currentCenterDate: dayjs.Dayjs;
  zoom: number;
  cols: number;
  editable: boolean;
  showBaselines: boolean;
  onTaskClick?: (task: GanttTask<TMeta>) => void;
  onTaskChange?: (change: GanttTaskChange, task: GanttTask<TMeta>) => void;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const GanttBars = <TMeta,>({
  rows,
  currentCenterDate,
  zoom,
  cols,
  editable,
  showBaselines,
  onTaskClick,
  onTaskChange
}: GanttBarsProps<TMeta>) => {
  const theme = useTheme();
  const [gesture, setGesture] = useState<Gesture | null>(null);

  const beginGesture = useCallback(
    (event: React.PointerEvent, task: GanttTask<TMeta>, reason: GanttTaskChange["reason"]) => {
      if (!editable || task.locked || task.kind === "summary") return;
      event.stopPropagation();
      event.preventDefault();

      const element = event.currentTarget as HTMLElement;
      element.setPointerCapture(event.pointerId);
      const pixelsPerDay = getPixelsPerDay(zoom);
      const originX = event.clientX;
      // The gesture's own running total. State drives the preview, but the
      // pointerup handler reads this: setState is async, so by the time the
      // drag ends the state it can see may be a frame behind the pointer.
      let latestDays = 0;

      const move = (moveEvent: PointerEvent) => {
        // Snapped to whole days: a Gantt drag that lands mid-day is a date the
        // user did not choose and the host would only have to round anyway.
        latestDays = Math.round((moveEvent.clientX - originX) / pixelsPerDay);
        setGesture({ id: task.id, reason, originX, days: latestDays });
      };

      const finish = (upEvent: PointerEvent) => {
        element.releasePointerCapture(upEvent.pointerId);
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", finish);
        element.removeEventListener("pointercancel", cancel);

        const days = latestDays;
        setGesture(null);
        if (days === 0) return;

        const start = dayjs(task.startDate);
        const end = dayjs(task.endDate);
        const change: GanttTaskChange = {
          id: task.id,
          reason,
          startDate: reason === "resize-end" ? task.startDate : start.add(days, "day").toDate(),
          endDate: reason === "resize-start" ? task.endDate : end.add(days, "day").toDate()
        };

        // A resize that would invert the bar is not a shorter task, it is a
        // mis-drag; clamp it to a single day rather than reporting nonsense.
        if (dayjs(change.endDate).isBefore(change.startDate, "day")) {
          if (reason === "resize-start") change.startDate = change.endDate;
          else change.endDate = change.startDate;
        }

        onTaskChange?.(change, task);
      };

      const cancel = () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", finish);
        element.removeEventListener("pointercancel", cancel);
        setGesture(null);
      };

      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", finish);
      element.addEventListener("pointercancel", cancel);
      setGesture({ id: task.id, reason, originX, days: 0 });
    },
    [editable, onTaskChange, zoom]
  );

  /** The dates to draw, which during a drag are the previewed ones. */
  const previewDates = (task: GanttTask<TMeta>) => {
    if (!gesture || gesture.id !== task.id || gesture.days === 0) {
      return { startDate: task.startDate, endDate: task.endDate };
    }

    const shift = (date: Date) => dayjs(date).add(gesture.days, "day").toDate();
    switch (gesture.reason) {
      case "resize-start":
        return { startDate: shift(task.startDate), endDate: task.endDate };
      case "resize-end":
        return { startDate: task.startDate, endDate: shift(task.endDate) };
      default:
        return { startDate: shift(task.startDate), endDate: shift(task.endDate) };
    }
  };

  return (
    <StyledBarsLayer>
      {rows.map((row) => {
        const { task, index } = row;
        const { startDate, endDate } = previewDates(task);
        const geometry = getBarGeometry(index, startDate, endDate, currentCenterDate, zoom, cols);
        const colour = task.bgColor ?? theme.colors.defaultTile;
        const dragging = gesture?.id === task.id;

        if (task.kind === "milestone") {
          return (
            <Milestone
              key={task.id}
              geometry={geometry}
              colour={colour}
              title={task.title}
              onClick={() => onTaskClick?.(task)}
            />
          );
        }

        if (task.kind === "summary") {
          return (
            <div key={task.id}>
              <StyledSummary
                style={{
                  left: geometry.x,
                  top: index * boxHeight + (boxHeight - 10) / 2,
                  width: geometry.width,
                  background: colour
                }}
                title={task.title}
                onClick={() => onTaskClick?.(task)}>
                <StyledSummaryBody />
              </StyledSummary>
              <StyledOutsideLabel
                style={{
                  left: geometry.x + geometry.width + 8,
                  top: index * boxHeight + (boxHeight - 14) / 2
                }}>
                {task.title}
              </StyledOutsideLabel>
            </div>
          );
        }

        const progress = Math.max(0, Math.min(100, task.progress ?? 0));
        const labelFits = geometry.width > 60;
        // Avatars sit immediately after the bar; a label that could not fit
        // inside has to clear them or the two overprint each other.
        const avatarCount = Math.min(task.assignees?.length ?? 0, 3);
        const avatarWidth = avatarCount === 0 ? 0 : avatarCount * 20 + 4;

        return (
          <div key={task.id}>
            {showBaselines && task.baseline && (
              <Baseline
                index={index}
                baseline={task.baseline}
                currentCenterDate={currentCenterDate}
                zoom={zoom}
                cols={cols}
              />
            )}

            <StyledBar
              $editable={editable && !task.locked}
              $dragging={!!dragging}
              style={{
                left: geometry.x,
                top: geometry.y,
                width: geometry.width,
                background: colour
              }}
              title={`${task.title}${task.subtitle ? ` — ${task.subtitle}` : ""}`}
              onPointerDown={(event) => beginGesture(event, task, "move")}
              onClick={() => onTaskClick?.(task)}>
              {progress > 0 && <StyledProgress style={{ width: `${progress}%` }} />}
              {labelFits && (
                <StyledBarLabel $color={getTileTextColor(colour)}>{task.title}</StyledBarLabel>
              )}
              {editable && !task.locked && (
                <>
                  <StyledResizeHandle
                    $edge="start"
                    onPointerDown={(event) => beginGesture(event, task, "resize-start")}
                  />
                  <StyledResizeHandle
                    $edge="end"
                    onPointerDown={(event) => beginGesture(event, task, "resize-end")}
                  />
                </>
              )}
            </StyledBar>

            {!labelFits && (
              <StyledOutsideLabel
                style={{
                  left: geometry.x + geometry.width + 8 + avatarWidth,
                  top: geometry.y + 4
                }}>
                {task.title}
              </StyledOutsideLabel>
            )}

            {task.assignees && task.assignees.length > 0 && (
              <StyledAssignees
                style={{
                  left: geometry.x + geometry.width + 6,
                  top: geometry.y + (ganttBarHeight - 18) / 2
                }}>
                {task.assignees.slice(0, 3).map((person) => (
                  <StyledAvatar
                    key={person.id}
                    $color={person.color ?? theme.colors.defaultTile}
                    title={person.name}>
                    {initials(person.name)}
                  </StyledAvatar>
                ))}
              </StyledAssignees>
            )}
          </div>
        );
      })}
    </StyledBarsLayer>
  );
};

const Milestone = ({
  geometry,
  colour,
  title,
  onClick
}: {
  geometry: BarGeometry;
  colour: string;
  title: string;
  onClick: () => void;
}) => (
  <>
    <StyledMilestone
      $size={milestoneRadius * 2}
      style={{
        left: geometry.x - milestoneRadius,
        top: geometry.centerY - milestoneRadius,
        background: colour
      }}
      title={title}
      onClick={onClick}
    />
    <StyledOutsideLabel
      style={{ left: geometry.x + milestoneRadius + 8, top: geometry.centerY - 7 }}>
      {title}
    </StyledOutsideLabel>
  </>
);

const Baseline = ({
  index,
  baseline,
  currentCenterDate,
  zoom,
  cols
}: {
  index: number;
  baseline: NonNullable<GanttTask["baseline"]>;
  currentCenterDate: dayjs.Dayjs;
  zoom: number;
  cols: number;
}) => {
  const geometry = getBarGeometry(
    index,
    baseline.startDate,
    baseline.endDate,
    currentCenterDate,
    zoom,
    cols
  );

  return (
    <StyledBaseline
      style={{
        left: geometry.x,
        top: geometry.y + ganttBarHeight - 1,
        width: geometry.width
      }}
    />
  );
};

export default GanttBars;
