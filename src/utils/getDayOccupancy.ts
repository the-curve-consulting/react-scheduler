import dayjs from "dayjs";
import { maxHoursPerDay } from "@/constants";
import { Config, OccupancyData, SchedulerProjectData, TimeUnits } from "@/types/global";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

export const getDayOccupancy = (
  config: Config,
  occupancy: SchedulerProjectData[],
  focusedDate: dayjs.Dayjs,
  includeTakenHoursOnWeekendsInDayView: boolean
): OccupancyData => {
  const focusedDayNum = focusedDate.isoWeekday();
  const getHoursAndMinutes: TimeUnits[] = occupancy.map((item) => {
    const { hours: itemHours, minutes: itemMinutes } = getDuration(item.occupancy);

    // if config was set to include free weekends max day num is 5 - friday else is 7 - whole week
    if (focusedDayNum <= (includeTakenHoursOnWeekendsInDayView ? 7 : 5)) {
      return { hours: itemHours, minutes: itemMinutes };
    }
    return { hours: 0, minutes: 0 };
  });

  const { hours: totalHours, minutes: totalMinutes } = getTotalHoursAndMinutes(getHoursAndMinutes);

  const maxHours = config?.maxHoursPerDay || maxHoursPerDay;
  const { free, overtime } = getTimeOccupancy(maxHours, {
    hours: totalHours,
    minutes: totalMinutes
  });

  return {
    taken: { hours: Math.max(0, totalHours), minutes: Math.max(0, totalMinutes) },
    free,
    overtime
  };
};
