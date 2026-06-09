import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { createMockData } from "./mock/appMock";
import { ParsedDatesRange } from "./utils/getDatesRange";
import {
  Config,
  ConfigFormValues,
  SchedulerData,
  SchedulerItemClickData,
  SchedulerProjectData,
  WorkingDuration
} from "./types/global";
import ConfigPanel from "./components/ConfigPanel";
import { StyledSchedulerFrame } from "./styles";
import { FetchDataParams, Scheduler } from ".";

type DemoProjectMeta = {
  personId: string;
  source: "mock";
};

const secondsInHour = 60 * 60;

const getDemoWorkingDurations = (personIndex: number): WorkingDuration[] => {
  const effectiveFrom = dayjs().subtract(1, "year").startOf("year").toDate();

  switch (personIndex % 4) {
    case 0:
      return [
        {
          effectiveFrom,
          flexibleHours: false,
          workingDays: [
            { day: "Monday", hours: 7.5 },
            { day: "Tuesday", hours: 7.5 },
            { day: "Wednesday", hours: 7.5 },
            { day: "Thursday", hours: 7.5 },
            { day: "Friday", hours: 6 }
          ]
        },
        {
          effectiveFrom: dayjs().add(1, "week").startOf("isoWeek").toDate(),
          flexibleHours: false,
          workingDays: [
            { day: "Monday", hours: 6 },
            { day: "Tuesday", hours: 6 },
            { day: "Wednesday", hours: 6 },
            { day: "Thursday", hours: 6 }
          ]
        }
      ];
    case 1:
      return [
        {
          effectiveFrom,
          flexibleHours: false,
          workingDays: [
            { day: "Monday", hours: 8 },
            { day: "Wednesday", hours: 8 },
            { day: "Friday", hours: 8 }
          ]
        }
      ];
    case 2:
      return [
        {
          effectiveFrom,
          flexibleHours: false,
          workingDays: [
            { day: "Tuesday", hours: 6 },
            { day: "Wednesday", hours: 6 },
            { day: "Thursday", hours: 6 },
            { day: "Friday", hours: 6 },
            { day: "Saturday", hours: 6 }
          ]
        }
      ];
    default:
      return [
        {
          effectiveFrom,
          flexibleHours: false,
          workingDays: [
            { day: "Monday", hours: 8 },
            { day: "Tuesday", hours: 8 },
            { day: "Wednesday", hours: 8 },
            { day: "Thursday", hours: 8 }
          ]
        }
      ];
  }
};

const toThroughputProject = (
  project: SchedulerProjectData<DemoProjectMeta>,
  throughput: number
): SchedulerProjectData<DemoProjectMeta> => ({
  id: project.id,
  startDate: project.startDate,
  endDate: project.endDate,
  title: project.title,
  subtitle: project.subtitle,
  description: project.description,
  bgColor: project.bgColor,
  meta: project.meta,
  throughput
});

const createVisibleDemoProjects = (
  personId: string,
  title: string,
  personIndex: number
): SchedulerProjectData<DemoProjectMeta>[] => {
  if (personIndex > 3) {
    return [];
  }

  const currentWeekStart = dayjs().startOf("isoWeek");

  return [
    {
      id: `${personId}-demo-throughput`,
      startDate: currentWeekStart.toDate(),
      endDate: currentWeekStart.add(13, "days").toDate(),
      throughput: 0.8,
      title: `${title} throughput demo`,
      subtitle: "80% of working hours",
      description: "Throughput project spanning working and non-working days",
      bgColor: "#728DE2",
      meta: {
        personId,
        source: "mock"
      }
    },
    {
      id: `${personId}-demo-occupancy`,
      startDate: currentWeekStart.add(4, "days").toDate(),
      endDate: currentWeekStart.add(8, "days").toDate(),
      occupancy: 4 * secondsInHour,
      title: `${title} occupancy demo`,
      subtitle: "4h fixed daily occupancy",
      description: "Legacy occupancy project mixed with throughput data",
      bgColor: "#D97706",
      meta: {
        personId,
        source: "mock"
      }
    }
  ];
};

function App() {
  const rangeUpdateTimeoutRef = useRef<number | null>(null);
  const pendingRangeRef = useRef<ParsedDatesRange | null>(null);

  const [values, setValues] = useState<ConfigFormValues>({
    peopleCount: 15,
    projectsPerYear: 5,
    yearsCovered: 5,
    startDate: undefined,
    maxRecordsPerPage: 50,
    isFullscreen: true
  });

  const { peopleCount, projectsPerYear, yearsCovered, isFullscreen, maxRecordsPerPage } = values;

  const mocked = useMemo<SchedulerData<DemoProjectMeta>>(
    (): SchedulerData<DemoProjectMeta> =>
      createMockData(+peopleCount, +yearsCovered, +projectsPerYear).map((person, personIndex) => {
        const generatedProjects = person.data.map((project, projectIndex) => {
          const projectWithMeta: SchedulerProjectData<DemoProjectMeta> = {
            ...project,
            meta: {
              personId: person.id,
              source: "mock"
            }
          };

          return projectIndex % 2 === 0
            ? toThroughputProject(projectWithMeta, projectIndex % 4 === 0 ? 0.8 : 0.5)
            : projectWithMeta;
        });

        return {
          ...person,
          workingDurations: getDemoWorkingDurations(personIndex),
          data: [
            ...createVisibleDemoProjects(person.id, person.label.title, personIndex),
            ...generatedProjects
          ]
        };
      }),
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

  const handleFetchData = useCallback(
    async (params: FetchDataParams): Promise<SchedulerData<DemoProjectMeta>> =>
      new Promise<SchedulerData<DemoProjectMeta>>((resolve, reject) => {
        const { range, signal } = params;

        if (signal?.aborted) {
          reject(new DOMException("Request aborted", "AbortError"));
          return;
        }

        const timeoutId = window.setTimeout(() => {
          signal?.removeEventListener("abort", handleAbort);

          const rowsInRange = mocked.map((person) => ({
            ...person,
            data: person.data.filter((project) => {
              const projectStart = dayjs(project.startDate);
              const projectEnd = dayjs(project.endDate);
              const rangeStart = dayjs(range.startDate);
              const rangeEnd = dayjs(range.endDate);

              return !projectStart.isAfter(rangeEnd) && !projectEnd.isBefore(rangeStart);
            })
          }));

          resolve(rowsInRange);
        }, 5000);

        function handleAbort() {
          window.clearTimeout(timeoutId);
          reject(new DOMException("Request aborted", "AbortError"));
        }

        signal?.addEventListener("abort", handleAbort, { once: true });
      }),
    [mocked]
  );

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

  const handleTileClick = useCallback((data: SchedulerProjectData<DemoProjectMeta>) => {
    const allocation =
      "occupancy" in data ? `${data.occupancy / secondsInHour}h` : `${data.throughput * 100}%`;

    console.log(
      `Item ${data.title} - ${data.subtitle} was clicked. \n==============\nStart date: ${data.startDate} \n==============\nEnd date: ${data.endDate}\n==============\nAllocation: ${allocation}\n==============\nPerson id: ${data.meta?.personId}`
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
      maxHoursPerWeek: 37.5
    }),
    [maxRecordsPerPage]
  );

  return (
    <>
      <ConfigPanel values={values} onSubmit={setValues} />
      {isFullscreen ? (
        <Scheduler<DemoProjectMeta>
          centerDate={values.startDate ? new Date(values.startDate).toISOString() : undefined}
          dataSourceKey={`${peopleCount}-${projectsPerYear}-${yearsCovered}`}
          onRangeChange={handleRangeChange}
          onFetchData={handleFetchData}
          isLoading={false}
          onTileClick={handleTileClick}
          onFilterData={handleFilterData}
          config={config}
          onItemClick={handleItemClick}
        />
      ) : (
        <StyledSchedulerFrame>
          <Scheduler<DemoProjectMeta>
            centerDate={values.startDate ? new Date(values.startDate).toISOString() : undefined}
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
