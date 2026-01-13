import { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import dayjs from "dayjs";
import { useCalendar } from "@/context/CalendarProvider";
import { SchedulerData, SchedulerProjectData, TooltipData, ZoomLevel } from "@/types/global";
import { getTooltipData } from "@/utils/getTooltipData";
import { usePagination } from "@/hooks/usePagination";
import EmptyBox from "../EmptyBox";
import { Grid, Header, LeftColumn, Tooltip } from "..";
import { CalendarProps } from "./types";
import { StyledOuterWrapper, StyledInnerWrapper, StyledEmptyBoxWrapper } from "./styles";

const initialTooltipData: TooltipData = {
  coords: { x: 0, y: 0 },
  resourceIndex: 0,
  disposition: {
    taken: { hours: 0, minutes: 0 },
    free: { hours: 0, minutes: 0 },
    overtime: { hours: 0, minutes: 0 }
  }
};

export const Calendar: FC<CalendarProps> = ({
  config,
  data,
  onTileClick,
  onItemClick,
  toggleTheme,
  topBarWidth
}) => {
  const [tooltipData, setTooltipData] = useState<TooltipData>(initialTooltipData);
  const [filteredData, setFilteredData] = useState(data);
  const [isVisible, setIsVisible] = useState(false);
  const [searchPhrase, setSearchPhrase] = useState("");
  const {
    zoom,
    startDate,
    currentCenterDate,
    viewportWidth,
    config: { includeTakenHoursOnWeekendsInDayView, showTooltip, showThemeToggle }
  } = useCalendar();
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    page,
    projectsPerPerson,
    totalRowsPerPage,
    rowsPerItem,
    currentPageNum,
    pagesAmount,
    next,
    previous,
    reset
  } = usePagination(filteredData);
  const debouncedHandleMouseOver = useRef(
    debounce(
      (
        e: MouseEvent,
        rowsPerItem: number[],
        projectsPerPerson: SchedulerProjectData[][][],
        zoom: ZoomLevel,
        currentCenterDate: dayjs.Dayjs,
        viewportWidth: number
      ) => {
        if (!gridRef.current) return;
        const { left, top } = gridRef.current.getBoundingClientRect();
        const tooltipCoords = { x: e.clientX - left, y: e.clientY - top };
        const {
          coords: { x, y },
          resourceIndex,
          disposition
        } = getTooltipData(
          config,
          tooltipCoords,
          rowsPerItem,
          projectsPerPerson,
          zoom,
          includeTakenHoursOnWeekendsInDayView,
          currentCenterDate,
          viewportWidth
        );
        console.log(x, y, resourceIndex, disposition);
        setTooltipData({ coords: { x, y }, resourceIndex, disposition });
        setIsVisible(true);
      },
      300
    )
  );
  const debouncedFilterData = useRef(
    debounce((dataToFilter: SchedulerData, enteredSearchPhrase: string) => {
      reset();
      setFilteredData(
        dataToFilter.filter((item) =>
          item.label.title.toLowerCase().includes(enteredSearchPhrase.toLowerCase())
        )
      );
    }, 500)
  );

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const phrase = event.target.value;
    setSearchPhrase(phrase);
    debouncedFilterData.current.cancel();
    debouncedFilterData.current(data, phrase);
  };

  const handleMouseLeave = useCallback(() => {
    debouncedHandleMouseOver.current.cancel();
    setIsVisible(false);
    setTooltipData(initialTooltipData);
  }, []);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) =>
      debouncedHandleMouseOver.current(
        e,
        rowsPerItem,
        projectsPerPerson,
        zoom,
        currentCenterDate,
        viewportWidth
      );
    const gridArea = gridRef.current;

    if (!gridArea) return;

    gridArea.addEventListener("mousemove", handleMouseOver);
    gridArea.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      gridArea.removeEventListener("mousemove", handleMouseOver);
      gridArea.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    debouncedHandleMouseOver,
    handleMouseLeave,
    projectsPerPerson,
    rowsPerItem,
    startDate,
    zoom,
    currentCenterDate,
    viewportWidth
  ]);

  useEffect(() => {
    if (searchPhrase) return;

    // Avoid unnecessary re-renders when data is the same as filteredData
    const isSame =
      data.length === filteredData.length && data.every((item, i) => item === filteredData[i]);

    if (!isSame) {
      setFilteredData(data);
    }
  }, [data, searchPhrase]);

  return (
    <StyledOuterWrapper>
      <LeftColumn
        data={page}
        pageNum={currentPageNum}
        pagesAmount={pagesAmount}
        rows={rowsPerItem}
        onLoadNext={next}
        onLoadPrevious={previous}
        searchInputValue={searchPhrase}
        onSearchInputChange={handleSearch}
        onItemClick={onItemClick}
      />
      <StyledInnerWrapper>
        <Header
          zoom={zoom}
          topBarWidth={topBarWidth}
          showThemeToggle={showThemeToggle}
          toggleTheme={toggleTheme}
        />
        {data.length ? (
          <Grid
            data={page}
            zoom={zoom}
            rows={totalRowsPerPage}
            ref={gridRef}
            onTileClick={onTileClick}
          />
        ) : (
          <StyledEmptyBoxWrapper width={topBarWidth}>
            <EmptyBox />
          </StyledEmptyBoxWrapper>
        )}
        {showTooltip && isVisible && tooltipData?.resourceIndex > -1 && (
          <Tooltip tooltipData={tooltipData} zoom={zoom} />
        )}
      </StyledInnerWrapper>
    </StyledOuterWrapper>
  );
};

export default Calendar;
