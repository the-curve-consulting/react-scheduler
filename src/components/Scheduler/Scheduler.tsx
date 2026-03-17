import { ThemeProvider } from "styled-components";
import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import dayjs from "dayjs";
import { Calendar } from "@/components";
import CalendarProvider from "@/context/CalendarProvider";
import LocaleProvider from "@/context/LocaleProvider";
import { outsideWrapperId } from "@/constants";
import { darkTheme, GlobalStyle, theme } from "@/styles";
import { Config, SchedulerData } from "@/types/global";
import deleteProjectsByIds from "./dataMutations/deleteProjectsByIds";
import upsertProjectsInRows from "./dataMutations/upsertProjectsInRows";
import {
  emptySchedulerFetchLoadingState,
  SchedulerAsyncProps,
  SchedulerComponent,
  SchedulerHandle,
  SchedulerProps
} from "./types";
import { usePrefetchedSchedulerData } from "./usePrefetchedSchedulerData";
import { StyledInnerWrapper, StyledOutsideWrapper } from "./styles";

const emptySchedulerData: SchedulerData<never> = [];

const isAsyncSchedulerProps = <TMeta,>(
  props: SchedulerProps<TMeta>
): props is SchedulerAsyncProps<TMeta> =>
  typeof (props as SchedulerAsyncProps).onFetchData === "function";

const SchedulerInner = <TMeta,>(
  props: SchedulerProps<TMeta>,
  ref: ForwardedRef<SchedulerHandle<TMeta>>
) => {
  const {
    config,
    startDate,
    dataSourceKey,
    onRangeChange,
    onTileClick,
    onFilterData,
    onClearFilterData,
    onItemClick,
    transformData,
    isLoading
  } = props;
  const onFetchData = isAsyncSchedulerProps(props) ? props.onFetchData : undefined;
  const sourceData = isAsyncSchedulerProps(props)
    ? props.initialData ?? emptySchedulerData
    : props.data;

  const appConfig: Config = useMemo(
    () => ({
      zoom: 0,
      filterButtonState: 1,
      includeTakenHoursOnWeekendsInDayView: false,
      showTooltip: true,
      translations: undefined,
      ...config
    }),
    [config]
  );

  const outsideWrapperRef = useRef<HTMLDivElement>(null);
  const [topBarWidth, setTopBarWidth] = useState(outsideWrapperRef.current?.clientWidth);

  const { schedulerData, fetchLoadingState, handleRangeChange, invalidate, setSchedulerData } =
    usePrefetchedSchedulerData({
      data: sourceData,
      dataLoading: appConfig.dataLoading,
      dataSourceKey,
      onFetchData,
      onRangeChange
    });
  const transformedData = useMemo(
    () => transformData?.(schedulerData) ?? schedulerData,
    [schedulerData, transformData]
  );

  useImperativeHandle(
    ref,
    () => ({
      invalidate,
      upsertProjects: (updates) => {
        setSchedulerData((prev: SchedulerData<TMeta>) => upsertProjectsInRows(prev, updates));
      },
      deleteProjects: (updates) => {
        setSchedulerData((prev: SchedulerData<TMeta>) => deleteProjectsByIds(prev, updates));
      }
    }),
    [invalidate, setSchedulerData]
  );

  const externalLoading = !!isLoading;
  const effectiveLoading = externalLoading || fetchLoadingState.blocking;
  const calendarLoadingState = externalLoading
    ? { any: true, blocking: true, forward: true, backward: true }
    : fetchLoadingState ?? emptySchedulerFetchLoadingState;

  const defaultStartDate = useMemo(() => dayjs(startDate), [startDate]);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(appConfig.defaultTheme ?? "light");

  const toggleTheme = () => {
    themeMode === "light" ? setThemeMode("dark") : setThemeMode("light");
  };

  const currentTheme = themeMode === "light" ? theme : darkTheme;
  const customColors = appConfig.theme ? appConfig.theme[currentTheme.mode] : {};
  const mergedTheme = {
    ...currentTheme,
    colors: {
      ...currentTheme.colors,
      ...customColors
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (outsideWrapperRef.current) {
        setTopBarWidth(outsideWrapperRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={mergedTheme}>
        <LocaleProvider lang={appConfig.lang} translations={appConfig.translations}>
          <CalendarProvider
            data={transformedData}
            isLoading={effectiveLoading}
            loadingState={calendarLoadingState}
            config={appConfig}
            onRangeChange={handleRangeChange}
            defaultStartDate={defaultStartDate}
            onFilterData={onFilterData}
            onClearFilterData={onClearFilterData}>
            <StyledOutsideWrapper
              showScroll={!!transformedData.length}
              id={outsideWrapperId}
              ref={outsideWrapperRef}>
              <StyledInnerWrapper>
                <Calendar
                  config={appConfig}
                  data={transformedData}
                  onTileClick={onTileClick}
                  topBarWidth={topBarWidth ?? 0}
                  onItemClick={onItemClick}
                  toggleTheme={toggleTheme}
                />
              </StyledInnerWrapper>
            </StyledOutsideWrapper>
          </CalendarProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  );
};

const SchedulerBase = forwardRef(SchedulerInner);
SchedulerBase.displayName = "Scheduler";
const Scheduler = SchedulerBase as SchedulerComponent;

export default Scheduler;
