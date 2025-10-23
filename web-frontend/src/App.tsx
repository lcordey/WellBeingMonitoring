import './App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WellBeingDashboard } from './components/WellBeingDashboard';
import { WellBeingDataExplorer } from './components/WellBeingDataExplorer';
import { WellBeingCalendar } from './components/WellBeingCalendar';
import { SelectedDateDetails } from './components/SelectedDateDetails';
import { WellBeingAdminPage } from './components/WellBeingAdminPage';
import { WellBeingDataEntry } from './components/WellBeingDataEntry';
import { WellBeingRecordingFeed } from './components/WellBeingRecordingFeed';
import {
  getAllWellBeingData,
  getWellBeingCategoryTypes,
  type WellBeingEntry,
} from './api';
import {
  fetchNotableLookup,
  hasNotableValue,
  normaliseCategoryKey,
  normaliseTypeKey,
  type NotableValueLookup,
} from './utils/notable';

const VIEW_OPTIONS = [
  { key: 'record-feed', label: 'Record data' },
  { key: 'entry', label: 'Manual entry' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'explorer', label: 'Explorer' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'definitions', label: 'Definitions' },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['key'];

const colorPalette = ['#4338ca', '#6366f1', '#312e81', '#5b21b6', '#7c3aed', '#1d4ed8', '#3730a3', '#4c1d95'];
const CALENDAR_BASE_COLORS: Record<string, string> = {
  observation: '#2563eb',
  symptom: '#f97316',
};

const CALENDAR_CATEGORY_KEYS = ['observation', 'symptom'] as const;
type CalendarCategoryKey = (typeof CALENDAR_CATEGORY_KEYS)[number];

type CalendarTypeOption = {
  key: string;
  label: string;
};

type CalendarFilterCategory = {
  key: CalendarCategoryKey;
  label: string;
  options: (CalendarTypeOption & { enabled: boolean })[];
};

type CalendarEnabledTypes = Partial<Record<CalendarCategoryKey, string[]>>;
type CalendarTypeOptions = Partial<Record<CalendarCategoryKey, CalendarTypeOption[]>>;

const isCalendarCategoryKey = (value: string): value is CalendarCategoryKey =>
  (CALENDAR_CATEGORY_KEYS as readonly string[]).includes(value);

const normaliseCategory = normaliseCategoryKey;
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const buildDateCategoriesMap = (
  entries: WellBeingEntry[],
  enabledTypes: CalendarEnabledTypes
): Record<string, string[]> => {
  const dateCategoryNotable = new Map<string, Set<string>>();

  entries.forEach((entry) => {
    const categoryKey = normaliseCategory(entry.category);
    if (!isCalendarCategoryKey(categoryKey)) {
      return;
    }

    const typeKey = normaliseTypeKey(entry.type);
    const categoryFilters = enabledTypes[categoryKey];

    if (Array.isArray(categoryFilters)) {
      if (categoryFilters.length === 0) {
        return;
      }
      if (!categoryFilters.includes(typeKey)) {
        return;
      }
    }

    const dateKey = entry.date.slice(0, 10);
    const categories = dateCategoryNotable.get(dateKey) ?? new Set<string>();
    categories.add(categoryKey);
    dateCategoryNotable.set(dateKey, categories);
  });

  const map: Record<string, string[]> = {};
  dateCategoryNotable.forEach((categories, dateKey) => {
    map[dateKey] = Array.from(categories).sort();
  });

  return map;
};

function App() {
  const today = new Date();
  const [mode, setMode] = useState<ViewMode>('record-feed');
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedDateEntries, setSelectedDateEntries] = useState<WellBeingEntry[]>([]);
  const [selectedDateLoading, setSelectedDateLoading] = useState(false);
  const [selectedDateError, setSelectedDateError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [dateCategoriesMap, setDateCategoriesMap] = useState<Record<string, string[]>>({});
  const [calendarEntries, setCalendarEntries] = useState<WellBeingEntry[]>([]);
  const [calendarTypeOptions, setCalendarTypeOptions] = useState<CalendarTypeOptions>({});
  const [enabledCalendarTypes, setEnabledCalendarTypes] =
    useState<CalendarEnabledTypes>({});
  const [calendarFiltersLoading, setCalendarFiltersLoading] = useState(false);
  const [calendarFiltersError, setCalendarFiltersError] = useState<string | null>(null);
  const [calendarFiltersInitialised, setCalendarFiltersInitialised] = useState(false);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({
    observation: 'observation',
    symptom: 'symptom',
  });
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const usedColors = new Set<string>();

    Object.entries(CALENDAR_BASE_COLORS).forEach(([key, color]) => {
      colors[key] = color;
      usedColors.add(color);
    });

    const dynamicKeys = Object.keys(categoryLabels)
      .filter((key) => !colors[key])
      .sort();

    let paletteIndex = 0;
    const takeNextColor = () => {
      for (let offset = 0; offset < colorPalette.length; offset += 1) {
        const candidate = colorPalette[(paletteIndex + offset) % colorPalette.length];
        if (!usedColors.has(candidate)) {
          paletteIndex = paletteIndex + offset + 1;
          return candidate;
        }
      }
      const fallback = colorPalette[paletteIndex % colorPalette.length];
      paletteIndex += 1;
      return fallback;
    };

    dynamicKeys.forEach((key) => {
      const color = takeNextColor();
      colors[key] = color;
      usedColors.add(color);
    });

    return colors;
  }, [categoryLabels]);

  const loadCalendarTypeOptions = useCallback(async () => {
    setCalendarFiltersLoading(true);
    setCalendarFiltersError(null);
    try {
      const categoryTypes = await getWellBeingCategoryTypes();
      const aggregated = new Map<
        CalendarCategoryKey,
        Map<string, CalendarTypeOption>
      >();

      categoryTypes.forEach((entry) => {
        const categoryKey = normaliseCategory(entry.category);
        if (!isCalendarCategoryKey(categoryKey)) {
          return;
        }

        const optionsByKey =
          aggregated.get(categoryKey) ?? new Map<string, CalendarTypeOption>();
        entry.types.forEach((type) => {
          const option: CalendarTypeOption = {
            key: normaliseTypeKey(type),
            label: type,
          };
          if (option.key.length === 0 || optionsByKey.has(option.key)) {
            return;
          }
          optionsByKey.set(option.key, option);
        });
        aggregated.set(categoryKey, optionsByKey);
      });

      const nextOptions: CalendarTypeOptions = {};
      aggregated.forEach((optionsByKey, categoryKey) => {
        const typeOptions = Array.from(optionsByKey.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        if (typeOptions.length > 0) {
          nextOptions[categoryKey] = typeOptions;
        }
      });

      setCalendarTypeOptions(nextOptions);
      setEnabledCalendarTypes((prev) => {
        const next: CalendarEnabledTypes = {};
        (Object.entries(nextOptions) as [CalendarCategoryKey, CalendarTypeOption[]][]).forEach(
          ([categoryKey, options]) => {
            const availableKeys = options.map((option) => option.key);
            const previousSelection = prev[categoryKey] ?? availableKeys;
            const previousSet = new Set(previousSelection);
            const retained = availableKeys.filter((key) => previousSet.has(key));
            next[categoryKey] = retained.length > 0 ? retained : [...availableKeys];
          }
        );
        return next;
      });
    } catch (error: unknown) {
      console.error('Unable to load calendar type options', error);
      setCalendarFiltersError(
        getErrorMessage(error, 'Unable to load calendar type filters.')
      );
      setCalendarTypeOptions({});
      setEnabledCalendarTypes({});
    } finally {
      setCalendarFiltersLoading(false);
    }
  }, []);

  const handleToggleCalendarType = useCallback(
    (categoryKey: string, typeKey: string) => {
      if (!isCalendarCategoryKey(categoryKey)) {
        return;
      }

      setEnabledCalendarTypes((prev) => {
        const options = calendarTypeOptions[categoryKey];
        if (!options) {
          return prev;
        }

        const availableKeys = options.map((option) => option.key);
        if (!availableKeys.includes(typeKey)) {
          return prev;
        }

        const previousSelection = prev[categoryKey] ?? availableKeys;
        const previousSet = new Set(previousSelection);
        const toggledSet = new Set(previousSelection);

        if (toggledSet.has(typeKey)) {
          toggledSet.delete(typeKey);
        } else {
          toggledSet.add(typeKey);
        }

        const nextSelection = availableKeys.filter((key) => toggledSet.has(key));
        const orderedPrevious = availableKeys.filter((key) => previousSet.has(key));

        if (
          orderedPrevious.length === nextSelection.length &&
          orderedPrevious.every((value, index) => value === nextSelection[index])
        ) {
          return prev;
        }

        return { ...prev, [categoryKey]: nextSelection };
      });
    },
    [calendarTypeOptions]
  );

  const handleToggleAllCalendarTypes = useCallback(
    (categoryKey: string, enabled: boolean) => {
      if (!isCalendarCategoryKey(categoryKey)) {
        return;
      }

      setEnabledCalendarTypes((prev) => {
        const options = calendarTypeOptions[categoryKey];
        if (!options) {
          return prev;
        }

        const availableKeys = options.map((option) => option.key);
        const nextSelection = enabled ? [...availableKeys] : [];
        const previousSelection = prev[categoryKey] ?? availableKeys;
        const previousSet = new Set(previousSelection);
        const orderedPrevious = availableKeys.filter((key) => previousSet.has(key));

        if (
          orderedPrevious.length === nextSelection.length &&
          orderedPrevious.every((value, index) => value === nextSelection[index])
        ) {
          return prev;
        }

        return { ...prev, [categoryKey]: nextSelection };
      });
    },
    [calendarTypeOptions]
  );

  const handleReloadCalendarTypes = useCallback(() => {
    void loadCalendarTypeOptions();
  }, [loadCalendarTypeOptions]);

  const refreshSelectedDateEntries = useCallback(() => {
    if (!selectedDate) return;
    setSelectedDateLoading(true);
    setSelectedDateError(null);
    getAllWellBeingData({ startDate: selectedDate, endDate: selectedDate })
      .then((data) => {
        setSelectedDateEntries(data);
      })
      .catch((error: unknown) => {
        setSelectedDateEntries([]);
        setSelectedDateError(
          getErrorMessage(error, 'Failed to load data for the selected date.')
        );
      })
      .finally(() => {
        setSelectedDateLoading(false);
      });
  }, [selectedDate]);

  const refreshCalendarData = useCallback(async () => {
    const startDate = new Date(calendarYear, calendarMonth, 1);
    const endDate = new Date(calendarYear, calendarMonth + 1, 0);
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);

    setCalendarLoading(true);
    setCalendarError(null);
    setCalendarEntries([]);
    setDateCategoriesMap({});
    try {
      const data = await getAllWellBeingData({ startDate: startDateStr, endDate: endDateStr });

      const labelsUpdate: Record<string, string> = {};
      data.forEach((entry) => {
        const categoryKey = normaliseCategory(entry.category);
        labelsUpdate[categoryKey] = entry.category;
      });

      const relevantEntries = data.filter((entry) => {
        const categoryKey = normaliseCategory(entry.category);
        return categoryKey === 'observation' || categoryKey === 'symptom';
      });

      let notableLookup: NotableValueLookup = {};
      if (relevantEntries.length > 0) {
        try {
          notableLookup = await fetchNotableLookup(relevantEntries);
        } catch (error) {
          console.error('Unable to compute notable values for the calendar view', error);
        }
      }
      const notableEntries = relevantEntries.filter((entry) =>
        hasNotableValue(entry, notableLookup)
      );

      setCalendarEntries(notableEntries);
      setCategoryLabels((prev) => ({ ...prev, ...labelsUpdate }));
    } catch (error: unknown) {
      setCalendarEntries([]);
      setDateCategoriesMap({});
      setCalendarError(getErrorMessage(error, 'Unable to load calendar data.'));
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    if (mode !== 'calendar') return;
    void refreshCalendarData();
  }, [mode, refreshCalendarData]);

  useEffect(() => {
    if (mode !== 'calendar') return;
    if (calendarFiltersInitialised) return;
    setCalendarFiltersInitialised(true);
    void loadCalendarTypeOptions();
  }, [mode, calendarFiltersInitialised, loadCalendarTypeOptions]);

  useEffect(() => {
    if (mode === 'calendar' && selectedDate) {
      refreshSelectedDateEntries();
    }
  }, [mode, selectedDate, refreshSelectedDateEntries]);

  useEffect(() => {
    setDateCategoriesMap(buildDateCategoriesMap(calendarEntries, enabledCalendarTypes));
  }, [calendarEntries, enabledCalendarTypes]);

  const handleEntryDeleted = useCallback(() => {
    refreshSelectedDateEntries();
    if (mode === 'calendar') {
      refreshCalendarData();
    }
  }, [mode, refreshCalendarData, refreshSelectedDateEntries]);

  const calendarFilterCategories = useMemo<CalendarFilterCategory[]>(() => {
    return CALENDAR_CATEGORY_KEYS.map((categoryKey) => {
      const options = calendarTypeOptions[categoryKey];
      if (!options || options.length === 0) {
        return null;
      }

      const defaultKeys = options.map((option) => option.key);
      const enabledKeys = enabledCalendarTypes[categoryKey];
      const activeKeys =
        enabledKeys && enabledKeys.length > 0 ? enabledKeys : defaultKeys;
      const activeSet = new Set(activeKeys);

      return {
        key: categoryKey,
        label: categoryLabels[categoryKey] ?? categoryKey,
        options: options.map((option) => ({
          ...option,
          enabled: activeSet.has(option.key),
        })),
      } satisfies CalendarFilterCategory;
    }).filter((item): item is CalendarFilterCategory => Boolean(item));
  }, [calendarTypeOptions, enabledCalendarTypes, categoryLabels]);

  return (
    <div className="App">
      <h1>Well-being data</h1>
      <div className="App__view-switcher">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setMode(option.key)}
            className={`App__view-button${mode === option.key ? ' App__view-button--active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === 'record-feed' ? (
        <WellBeingRecordingFeed />
      ) : mode === 'dashboard' ? (
        <WellBeingDashboard />
      ) : mode === 'explorer' ? (
        <WellBeingDataExplorer />
      ) : mode === 'calendar' ? (
        <>
          <WellBeingCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            setCalendarYear={setCalendarYear}
            setCalendarMonth={setCalendarMonth}
            dateCategoriesMap={dateCategoriesMap}
            categoryLabels={categoryLabels}
            categoryColors={categoryColors}
            filterCategories={calendarFilterCategories}
            filterLoading={calendarFiltersLoading}
            filterError={calendarFiltersError}
            onFilterToggle={handleToggleCalendarType}
            onFilterToggleAll={handleToggleAllCalendarTypes}
            onFilterRetry={handleReloadCalendarTypes}
          />
          {calendarLoading && <p className="calendar__info">Loading calendar data…</p>}
          {calendarError && <div className="calendar__error">{calendarError}</div>}
          <SelectedDateDetails
            date={selectedDate}
            entries={selectedDateEntries}
            isLoading={selectedDateLoading}
            error={selectedDateError}
            onRefresh={refreshSelectedDateEntries}
            onEntryDeleted={handleEntryDeleted}
          />
        </>
      ) : mode === 'entry' ? (
        <WellBeingDataEntry />
      ) : (
        <WellBeingAdminPage />
      )}
    </div>
  );
}

export default App;
