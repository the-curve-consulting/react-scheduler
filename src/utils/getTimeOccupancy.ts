import { minutesInHour } from "@/constants";
import { OccupancyData, TimeUnits } from "@/types/global";

export const getTimeOccupancy = (
  maxHours: number,
  timeUnits: TimeUnits
): Omit<OccupancyData, "taken"> => {
  // Convert fractional hours to minutes (e.g., 7.5 hours -> 7 hours 30 minutes)
  const maxHoursInt = Math.floor(maxHours);
  const maxMinutes = Math.round((maxHours - maxHoursInt) * minutesInHour);

  const getFreeTime = () => {
    const totalMaxMinutes = maxHoursInt * minutesInHour + maxMinutes;
    const totalTakenMinutes = timeUnits.hours * minutesInHour + timeUnits.minutes;
    const freeMinutes = totalMaxMinutes - totalTakenMinutes;

    if (freeMinutes <= 0) {
      return { hours: 0, minutes: 0 };
    }

    return {
      hours: Math.floor(freeMinutes / minutesInHour),
      minutes: freeMinutes % minutesInHour
    };
  };

  const getOverTime = () => {
    const totalMaxMinutes = maxHoursInt * minutesInHour + maxMinutes;
    const totalTakenMinutes = timeUnits.hours * minutesInHour + timeUnits.minutes;
    const overtimeMinutes = totalTakenMinutes - totalMaxMinutes;

    if (overtimeMinutes <= 0) {
      return { hours: 0, minutes: 0 };
    }

    return {
      hours: Math.floor(overtimeMinutes / minutesInHour),
      minutes: overtimeMinutes % minutesInHour
    };
  };

  return {
    free: getFreeTime(),
    overtime: getOverTime()
  };
};
