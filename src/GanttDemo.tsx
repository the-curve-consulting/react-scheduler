import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import { GanttData, GanttTask, GanttTaskChange } from "./types/gantt";
import { ZoomLevel } from "./types/global";
import { Gantt } from ".";

type DemoMeta = { owner: string };

const monday = dayjs().startOf("isoWeek");
const on = (offset: number) => monday.add(offset, "day").toDate();

const buildTasks = (): Array<GanttTask<DemoMeta>> => [
  { id: "discovery", title: "Discovery", kind: "summary", startDate: on(0), endDate: on(6) },
  {
    id: "audit",
    parentId: "discovery",
    title: "Content audit",
    startDate: on(0),
    endDate: on(3),
    progress: 100,
    bgColor: "#0D9488",
    assignees: [{ id: "cm", name: "Cleo Marsh", color: "#0D9488" }],
    meta: { owner: "cm" }
  },
  {
    id: "interviews",
    parentId: "discovery",
    title: "Stakeholder interviews",
    startDate: on(0),
    endDate: on(2),
    progress: 100,
    bgColor: "#0D9488",
    assignees: [{ id: "ao", name: "Ada Okonjo", color: "#EE2B52" }]
  },
  {
    id: "requirements",
    parentId: "discovery",
    title: "Requirements sign-off",
    startDate: on(4),
    endDate: on(6),
    progress: 60,
    bgColor: "#0D9488",
    baseline: { startDate: on(3), endDate: on(5) }
  },
  { id: "design", title: "Design", kind: "summary", startDate: on(7), endDate: on(20) },
  {
    id: "wireframes",
    parentId: "design",
    title: "Wireframes",
    startDate: on(7),
    endDate: on(13),
    progress: 40,
    assignees: [{ id: "cm", name: "Cleo Marsh", color: "#0D9488" }]
  },
  {
    id: "visuals",
    parentId: "design",
    title: "Visual design",
    startDate: on(9),
    endDate: on(19),
    progress: 10,
    baseline: { startDate: on(9), endDate: on(16) }
  },
  {
    id: "design-gate",
    parentId: "design",
    title: "Design approved",
    kind: "milestone",
    startDate: on(20),
    endDate: on(20),
    bgColor: "#EE2B52"
  },
  { id: "build", title: "Build", kind: "summary", startDate: on(21), endDate: on(41) },
  {
    id: "scaffold",
    parentId: "build",
    title: "Scaffold the app",
    startDate: on(21),
    endDate: on(24),
    bgColor: "#2563EB"
  },
  {
    id: "components",
    parentId: "build",
    title: "Component library",
    startDate: on(25),
    endDate: on(34),
    bgColor: "#2563EB"
  },
  {
    id: "templates",
    parentId: "build",
    title: "Page templates",
    startDate: on(28),
    endDate: on(41),
    bgColor: "#2563EB"
  },
  {
    id: "live",
    title: "Site live",
    kind: "milestone",
    startDate: on(44),
    endDate: on(44),
    bgColor: "#EE2B52"
  }
];

const links: GanttData<DemoMeta>["links"] = [
  { id: "l1", predecessorId: "audit", successorId: "requirements" },
  { id: "l2", predecessorId: "interviews", successorId: "requirements" },
  { id: "l3", predecessorId: "discovery", successorId: "design" },
  { id: "l4", predecessorId: "wireframes", successorId: "visuals", kind: "start_to_start" },
  { id: "l5", predecessorId: "visuals", successorId: "design-gate" },
  { id: "l6", predecessorId: "design-gate", successorId: "build" },
  { id: "l7", predecessorId: "scaffold", successorId: "components" },
  { id: "l8", predecessorId: "components", successorId: "templates", kind: "start_to_start" },
  { id: "l9", predecessorId: "build", successorId: "live" }
];

/**
 * Development harness for <Gantt>. Reached at /#gantt; the Scheduler demo in
 * App.tsx is left exactly as it was.
 */
const GanttDemo = () => {
  const [tasks, setTasks] = useState(buildTasks);
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [lastChange, setLastChange] = useState<string>("");

  const data = useMemo<GanttData<DemoMeta>>(() => ({ tasks, links }), [tasks]);

  // The component reports a drag rather than applying it, so this is where a
  // real host would reschedule and write back. Here it just moves the bar.
  const handleTaskChange = useCallback((change: GanttTaskChange, task: GanttTask<DemoMeta>) => {
    setTasks((current) =>
      current.map((candidate) =>
        candidate.id === change.id
          ? { ...candidate, startDate: change.startDate, endDate: change.endDate }
          : candidate
      )
    );
    setLastChange(
      `${task.title}: ${change.reason} → ${dayjs(change.startDate).format("D MMM")} – ${dayjs(
        change.endDate
      ).format("D MMM")}`
    );
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>&lt;Gantt&gt; demo</strong>
        {([0, 1, 2] as Array<ZoomLevel>).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setZoom(level)}
            style={{ fontWeight: zoom === level ? 700 : 400 }}>
            {["Weeks", "Days", "Hours"][level]}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#777" }}>{lastChange}</span>
      </div>
      <div style={{ position: "relative", width: "100%", height: "calc(100vh - 80px)" }}>
        {/* Keyed on zoom: the calendar provider seeds its zoom from config on
            mount and owns it thereafter (the View -/+ buttons), so these
            shortcut buttons remount rather than fighting it. */}
        <Gantt<DemoMeta>
          key={zoom}
          data={data}
          config={{ zoom, showThemeToggle: true }}
          onTaskChange={handleTaskChange}
          onTaskClick={(task) => setLastChange(`clicked ${task.title}`)}
        />
      </div>
    </div>
  );
};

export default GanttDemo;
