import { Config, WorkingDay, WorkingDuration } from "@/types/global";
import { businessDays, DaysOfWeekMap, maxHoursPerWeek } from "@/constants";

export const getDefaultWorkingDurations = (config: Config): WorkingDuration[] => {
  const hoursPerDay = (config.maxHoursPerWeek ?? maxHoursPerWeek) / businessDays;

  return [
    {
      effectiveFrom: new Date(0),
      flexibleHours: false,
      workingDays: Array.from(
        { length: businessDays },
        (_, i): WorkingDay =>
          <WorkingDay>{
            day: Object.keys(DaysOfWeekMap)[i],
            hours: hoursPerDay
          }
      )
    }
  ];
};
