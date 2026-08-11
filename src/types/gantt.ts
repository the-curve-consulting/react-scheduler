import { Config } from "./global";

/**
 * Data types for the <Gantt> view.
 *
 * These are deliberately separate from SchedulerData rather than an extension
 * of it. <Scheduler> answers "how much of this person's day is taken?", so
 * every tile it draws must declare an occupancy or a throughput. A Gantt task
 * answers "when does this piece of work happen, and what has to happen first?"
 * and has no such quantity. Folding the two into one union would force every
 * Gantt task to carry a field that means nothing to it.
 */

/** How a task is drawn. Summary bars and milestones are not editable shapes. */
export type GanttTaskKind = "task" | "milestone" | "summary";

export type GanttLinkKind =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish"
  | "start_to_finish";

export type GanttTask<TMeta = unknown> = {
  id: string;
  /** Omit or set null for a top-level row. Parents may appear after children. */
  parentId?: string | null;
  title: string;
  subtitle?: string;
  startDate: Date;
  /** For a milestone this equals startDate; the bar collapses to a marker. */
  endDate: Date;
  /**
   * Defaults to "task". A "summary" is drawn as a bracket rather than a bar and
   * is never draggable — its dates belong to its children.
   */
  kind?: GanttTaskKind;
  /** 0-100. Drawn as a fill inside the bar. */
  progress?: number;
  /** Bar colour, any CSS colour. Falls back to the theme's default tile. */
  bgColor?: string;
  /** Drawn as a ghost bar beneath the live one, to show slippage. */
  baseline?: { startDate: Date; endDate: Date };
  /** Renders as initials in a chip on the bar. */
  assignees?: Array<{ id: string; name: string; color?: string }>;
  /** Suppresses drag and resize for this task alone. */
  locked?: boolean;
  meta?: TMeta;
};

export type GanttLink = {
  id: string;
  predecessorId: string;
  successorId: string;
  /** Defaults to "finish_to_start". */
  kind?: GanttLinkKind;
};

export type GanttData<TMeta = unknown> = {
  tasks: Array<GanttTask<TMeta>>;
  links?: Array<GanttLink>;
};

/** A task placed in the outline: which row it occupies and how deep it sits. */
export type GanttRow<TMeta = unknown> = {
  task: GanttTask<TMeta>;
  index: number;
  depth: number;
  hasChildren: boolean;
  collapsed: boolean;
};

/** What a drag or resize produced, before the host has agreed to it. */
export type GanttTaskChange = {
  id: string;
  startDate: Date;
  endDate: Date;
  /** Which gesture produced it, so a host can treat a resize differently. */
  reason: "move" | "resize-start" | "resize-end";
};

export type GanttConfig = Config & {
  /**
   * Width of the outline column in pixels. Set 0 to hide it entirely, for a
   * host that renders its own task grid beside the chart.
   * @default 240
   */
  outlineWidth?: number;
  /**
   * Drag to move and resize bars.
   * @default true
   */
  editable?: boolean;
  /**
   * Draw dependency arrows between linked bars.
   * @default true
   */
  showLinks?: boolean;
  /**
   * Draw a ghost bar under any task carrying a `baseline`.
   * @default true
   */
  showBaselines?: boolean;
  /**
   * Draw a vertical marker at the current date and time.
   * @default true
   */
  showToday?: boolean;
  /**
   * Text on the today marker's tab. Set "" to draw the line alone.
   * @default "Today"
   */
  todayLabel?: string;
};
