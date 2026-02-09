import {
  weekWidth,
  dayWidth,
  outsideWrapperId,
  leftColumnWidth,
  zoom2ColumnWidth
} from "@/constants";

export const getCols = (zoom: number) => {
  const wrapperWidth = document.getElementById(outsideWrapperId)?.clientWidth || 0;
  const componentWidth = wrapperWidth - leftColumnWidth;

  // Returns the number of visible columns that fit in the viewport
  switch (zoom) {
    case 1:
      return Math.ceil(componentWidth / dayWidth);
    case 2:
      return Math.ceil(componentWidth / zoom2ColumnWidth);
    default:
      return Math.ceil(componentWidth / weekWidth);
  }
};
