import { useCallback, useMemo, useState } from "react";
import { GanttRow, GanttTask } from "@/types/gantt";

/**
 * Turns a flat task list into the rows the chart draws.
 *
 * Callers hand over tasks in whatever order suits them — a parent may arrive
 * after its children — and get back reading order: each task followed by its
 * descendants, with anything under a collapsed parent removed.
 *
 * Sibling order is the order the tasks arrived in, so a host that has already
 * decided how its plan reads (a WBS number, a position column) does not have to
 * encode that decision twice.
 */
export const useGanttRows = <TMeta>(
  tasks: Array<GanttTask<TMeta>>,
  options?: { defaultCollapsed?: Array<string> }
) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(options?.defaultCollapsed ?? [])
  );

  const { rows, allRows } = useMemo(() => {
    const known = new Set(tasks.map((task) => task.id));
    const childrenOf = new Map<string | null, Array<GanttTask<TMeta>>>();

    for (const task of tasks) {
      // A parentId pointing at a task that was not supplied would strand the
      // whole subtree, so treat it as a root instead of dropping it.
      const parentId =
        task.parentId && known.has(task.parentId) && task.parentId !== task.id
          ? task.parentId
          : null;
      const siblings = childrenOf.get(parentId) ?? [];
      siblings.push(task);
      childrenOf.set(parentId, siblings);
    }

    const flattened: Array<GanttRow<TMeta>> = [];
    const visible: Array<GanttRow<TMeta>> = [];
    const seen = new Set<string>();

    const walk = (parentId: string | null, depth: number, hidden: boolean) => {
      for (const task of childrenOf.get(parentId) ?? []) {
        // Guards against a parentId cycle, which would otherwise recurse for ever.
        if (seen.has(task.id)) continue;
        seen.add(task.id);

        const children = childrenOf.get(task.id) ?? [];
        const isCollapsed = collapsed.has(task.id);
        const row: GanttRow<TMeta> = {
          task,
          index: hidden ? -1 : visible.length,
          depth,
          hasChildren: children.length > 0,
          collapsed: isCollapsed
        };

        flattened.push(row);
        if (!hidden) visible.push(row);

        walk(task.id, depth + 1, hidden || isCollapsed);
      }
    };

    walk(null, 0, false);

    return { rows: visible, allRows: flattened };
  }, [tasks, collapsed]);

  const toggle = useCallback((id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  /** Row index by task id, for placing links without a second walk. */
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => map.set(row.task.id, row.index));
    return map;
  }, [rows]);

  return { rows, allRows, indexById, collapsed, toggle };
};
