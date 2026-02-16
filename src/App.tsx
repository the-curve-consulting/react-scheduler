import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { createMockData } from "./mock/appMock";
import { ParsedDatesRange } from "./utils/getDatesRange";
import {
  Config,
  ConfigFormValues,
  SchedulerItemClickData,
  SchedulerProjectData
} from "./types/global";
import ConfigPanel from "./components/ConfigPanel";
import { StyledSchedulerFrame } from "./styles";
import { Scheduler } from ".";

function App() {
  const rangeUpdateTimeoutRef = useRef<number | null>(null);
  const pendingRangeRef = useRef<ParsedDatesRange | null>(null);

  const [values, setValues] = useState<ConfigFormValues>({
    peopleCount: 15,
    projectsPerYear: 5,
    yearsCovered: 0,
    startDate: undefined,
    maxRecordsPerPage: 50,
    isFullscreen: true
  });

  const { peopleCount, projectsPerYear, yearsCovered, isFullscreen, maxRecordsPerPage } = values;

  const mocked = useMemo(
    () => createMockData(+peopleCount, +yearsCovered, +projectsPerYear),
    [peopleCount, projectsPerYear, yearsCovered]
  );

  const [range, setRange] = useState<ParsedDatesRange>({
    startDate: new Date(),
    endDate: new Date()
  });

  useEffect(
    () => () => {
      if (rangeUpdateTimeoutRef.current !== null) {
        window.clearTimeout(rangeUpdateTimeoutRef.current);
      }
    },
    []
  );

  const handleRangeChange = useCallback((nextRange: ParsedDatesRange) => {
    pendingRangeRef.current = nextRange;
    if (rangeUpdateTimeoutRef.current !== null) {
      window.clearTimeout(rangeUpdateTimeoutRef.current);
    }

    rangeUpdateTimeoutRef.current = window.setTimeout(() => {
      const pendingRange = pendingRangeRef.current;
      if (!pendingRange) return;

      setRange((prev) => {
        const isSameRange =
          prev.startDate.getTime() === pendingRange.startDate.getTime() &&
          prev.endDate.getTime() === pendingRange.endDate.getTime();
        return isSameRange ? prev : pendingRange;
      });
    }, 120);
  }, []);

  // Note: this is just a demo, so we filter data based on start and end dates of the range.
  // There is problem here because every update of the filteredData triggers re-render of Grid and Tileset components.
  // Proposal is to modify data retrieval logic to avoid unnecessary re-renders - like smart pagination.
  const filteredData = useMemo(
    () =>
      mocked.map((person) => ({
        ...person,
        data: person.data.filter(
          (project) =>
            dayjs(project.startDate).isBetween(range.startDate, range.endDate) ||
            dayjs(project.endDate).isBetween(range.startDate, range.endDate) ||
            (dayjs(project.startDate).isBefore(range.startDate, "day") &&
              dayjs(project.endDate).isAfter(range.endDate, "day"))
        )
      })),
    [mocked, range.endDate, range.startDate]
  );

  const handleFilterData = useCallback(() => {
    console.log(`Filters button was clicked.`);
  }, []);

  const handleTileClick = useCallback((data: SchedulerProjectData) => {
    console.log(
      `Item ${data.title} - ${data.subtitle} was clicked. \n==============\nStart date: ${data.startDate} \n==============\nEnd date: ${data.endDate}\n==============\nOccupancy: ${data.occupancy}`
    );
  }, []);

  const handleItemClick = useCallback((data: SchedulerItemClickData) => {
    console.log("clicked: ", data);
  }, []);

  const config = useMemo(
    (): Config => ({
      zoom: 0,
      maxRecordsPerPage: maxRecordsPerPage,
      showThemeToggle: true,
      maxHoursPerDay: 7.5,
      maxHoursPerWeek: 37.5
    }),
    [maxRecordsPerPage]
  );

  return (
    <>
      <ConfigPanel values={values} onSubmit={setValues} />
      {isFullscreen ? (
        <Scheduler
          startDate={values.startDate ? new Date(values.startDate).toISOString() : undefined}
          onRangeChange={handleRangeChange}
          data={filteredData}
          isLoading={false}
          onTileClick={handleTileClick}
          onFilterData={handleFilterData}
          config={config}
          onItemClick={handleItemClick}
        />
      ) : (
        <StyledSchedulerFrame>
          <Scheduler
            startDate={values.startDate ? new Date(values.startDate).toISOString() : undefined}
            onRangeChange={handleRangeChange}
            isLoading={false}
            data={filteredData}
            onTileClick={handleTileClick}
            onFilterData={handleFilterData}
            onItemClick={handleItemClick}
          />
        </StyledSchedulerFrame>
      )}
    </>
  );
}

export default App;
