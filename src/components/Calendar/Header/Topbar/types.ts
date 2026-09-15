import { SchedulerToolbar } from "@/types/global";

export type TopbarProps = {
  width: number;
  showThemeToggle?: boolean;
  toggleTheme?: () => void;
  toolbar?: SchedulerToolbar;
};
