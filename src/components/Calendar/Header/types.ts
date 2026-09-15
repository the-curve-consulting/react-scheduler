import { SchedulerToolbar } from "@/types/global";

export type HeaderProps = {
  zoom: number;
  topBarWidth: number;
  showThemeToggle?: boolean;
  toggleTheme?: () => void;
  /**
   * How far from the left edge the ruler starts, which must match the width of
   * whatever column sits beside the chart. Defaults to the Scheduler's own left
   * column, so existing callers are unaffected.
   */
  leftOffset?: number;
  /**
   * Suppresses the built-in prev/Today/next topbar, for a host that renders its
   * own controls above the ruler. Defaults to showing it.
   */
  hideTopbar?: boolean;
  /**
   * Where the ruler comes to rest when the chart is scrolled down, for a caller
   * that pins its own controls above it. Defaults to the top of the scroll
   * container, which is where <Scheduler> wants it.
   */
  stickyTop?: number;
  toolbar?: SchedulerToolbar;
};
