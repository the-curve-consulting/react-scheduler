import { SchedulerItemClickData, SchedulerRowLabel } from "@/types/global";

export type LeftColumnItemProps<TMeta = unknown> = {
  id: string;
  item: SchedulerRowLabel;
  rows: number;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
};

export type StyledTextProps = {
  isMain?: boolean;
};

export type StyledLeftColumnItemWrapperProps = {
  rows: number;
  clickable: boolean;
};
