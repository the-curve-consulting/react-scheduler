import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import dayjs from "dayjs";
import { useCalendar } from "@/context/CalendarProvider";
import {
  SchedulerData,
  SchedulerProjectData,
  TooltipData,
  WorkingDuration,
  ZoomLevel
} from "@/types/global";
import { getTooltipData } from "@/utils/getTooltipData";
import { usePagination } from "@/hooks/usePagination";
import { getDefaultWorkingDurations } from "@/utils/getDefaultWorkingDurations";
import { Grid, Header, LeftColumn, Tooltip } from "..";
import { CalendarProps } from "./types";
import { StyledOuterWrapper, StyledInnerWrapper } from "./styles";

const initialTooltipData: TooltipData = {
  coords: { x: 0, y: 0 },
  resourceIndex: 0,
  disposition: {
    taken: { hours: 0, minutes: 0 },
    free: { hours: 0, minutes: 0 },
    overtime: { hours: 0, minutes: 0 }
  }
};

export const Calendar = <TMeta,>({
  config,
  data,
  onTileClick,
  onItemClick,
  toggleTheme,
  topBarWidth
}: CalendarProps<TMeta>) => {
  const [tooltipData, setTooltipData] = useState<TooltipData>(initialTooltipData);
  const [filteredData, setFilteredData] = useState(data);
  const [isVisible, setIsVisible] = useState(false);
  const [searchPhrase, setSearchPhrase] = useState("");
  const {
    zoom,
    startDate,
    currentCenterDate,
    viewportWidth,
    cols,
    config: { includeTakenHoursOnWeekendsInDayView, showTooltip, showThemeToggle }
  } = useCalendar<TMeta>();
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
  } = usePagination<TMeta>(filteredData);

  const defaultWorkingDurations = useMemo(() => getDefaultWorkingDurations(config), [config]);
  const workingDurationsPerPerson = useMemo<WorkingDuration[][]>(
    () => page.map((row) => row.workingDurations ?? defaultWorkingDurations),
    [defaultWorkingDurations, page]
  );
  /* eslint-disable react-hooks/refs --
     The closure reads gridRef.current only inside the debounced callback, which fires
     300ms after a mousemove event — never during render. The rule cannot statically
     verify that debounce defers its callback, so it flags the closure capture.
     Refactoring the timing semantics (e.g. moving the read into the event handler)
     would change observable behaviour and there are no tests to guard against
     regressions in tooltip positioning. */
  const debouncedHandleMouseOver = useRef(
    debounce(
      (
        e: MouseEvent,
        rowsPerItem: number[],
        projectsPerPerson: SchedulerProjectData<TMeta>[][][],
        zoom: ZoomLevel,
        currentCenterDate: dayjs.Dayjs,
        cols: number,
        workingDurationsPerPerson: WorkingDuration[][]
      ) => {
        if (!gridRef.current) return;
        const { left, top } = gridRef.current.getBoundingClientRect();
        const tooltipCoords = { x: e.clientX - left, y: e.clientY - top };
        const {
          coords: { x, y },
          resourceIndex,
          disposition
        } = getTooltipData<TMeta>(
          config,
          tooltipCoords,
          rowsPerItem,
          projectsPerPerson,
          zoom,
          includeTakenHoursOnWeekendsInDayView,
          currentCenterDate,
          cols,
          workingDurationsPerPerson
        );
        setTooltipData({ coords: { x, y }, resourceIndex, disposition });
        setIsVisible(true);
      },
      300
    )
  );
  /* eslint-enable react-hooks/refs */
  const debouncedFilterData = useRef(
    debounce((dataToFilter: SchedulerData<TMeta>, enteredSearchPhrase: string) => {
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
        cols,
        workingDurationsPerPerson
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
    currentCenterDate,
    cols,
    zoom,
    viewportWidth,
    workingDurationsPerPerson
  ]);

  useEffect(() => {
    if (searchPhrase) return;

    // Avoid unnecessary re-renders when data is the same as filteredData
    const isSame =
      data.length === filteredData.length && data.every((item, i) => item === filteredData[i]);

    if (!isSame) {
      setFilteredData(data);
    }
  }, [data, filteredData, searchPhrase]);

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
        <Grid
          data={page}
          zoom={zoom}
          rows={totalRowsPerPage}
          ref={gridRef}
          workingDurationsPerPerson={workingDurationsPerPerson}
          onTileClick={onTileClick}
        />
        {showTooltip && isVisible && tooltipData?.resourceIndex > -1 && (
          <Tooltip tooltipData={tooltipData} zoom={zoom} />
        )}
      </StyledInnerWrapper>
    </StyledOuterWrapper>
  );
};

export default Calendar;
