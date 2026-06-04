import { minutesInHour } from "@/constants";
import { TimeUnits } from "@/types/global";

export const getTotalHoursAndMinutes = (items: TimeUnits[]): TimeUnits => {
  const totalMinutes = items.reduce(
    (sum, item) => sum + item.hours * minutesInHour + item.minutes,
    0
  );

  return {
    hours: Math.floor(totalMinutes / minutesInHour),
    minutes: totalMinutes % minutesInHour
  };
};
