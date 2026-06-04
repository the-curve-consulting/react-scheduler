import { TimeUnits } from "@/types/global";

export const getDuration = (seconds: number): TimeUnits => {
  const totalMinutes = Math.floor(seconds / 60);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
};
