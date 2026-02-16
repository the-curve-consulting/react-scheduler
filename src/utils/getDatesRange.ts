import dayjs from "dayjs";
export type DatesRange = {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

export type ParsedDatesRange = {
  startDate: Date;
  endDate: Date;
};
