import dayjs from "dayjs";
import { Day } from "@/types/global";
import { parseDay } from "@/utils/dates";

type WeeklyHeaderAnchor = {
  firstVisibleWeek: dayjs.Dayjs;
  startDate: Day;
  dayOfYear: number;
};

export const getWeeklyHeaderAnchor = (
  currentCenterDate: dayjs.Dayjs,
  cols: number
): WeeklyHeaderAnchor => {
  const centerWeek = currentCenterDate.startOf("isoWeek");
  const centerCol = Math.floor(cols / 2);
  const firstVisibleWeek = centerWeek.subtract(centerCol, "weeks");

  return {
    firstVisibleWeek,
    startDate: parseDay(firstVisibleWeek),
    dayOfYear: firstVisibleWeek.dayOfYear()
  };
};
