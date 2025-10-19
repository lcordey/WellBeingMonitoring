import './App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WellBeingDashboard } from './components/WellBeingDashboard';
import { WellBeingDataExplorer } from './components/WellBeingDataExplorer';
import { WellBeingCalendar } from './components/WellBeingCalendar';
import { SelectedDateDetails } from './components/SelectedDateDetails';
import { WellBeingAdminPage } from './components/WellBeingAdminPage';
import { WellBeingDataEntry } from './components/WellBeingDataEntry';
import { getAllWellBeingData, type WellBeingEntry } from './api';
import {
  fetchNotableLookup,
  hasNotableValue,
  normaliseCategoryKey,
  type NotableValueLookup,
} from './utils/notable';

const VIEW_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'explorer', label: 'Explorer' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'entry', label: 'Record data' },
  { key: 'definitions', label: 'Definitions' },
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]['key'];

const colorPalette = ['#2563eb', '#dc2626', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#9333ea'];

const normaliseCategory = normaliseCategoryKey;
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function App() {
  const today = new Date();
  const [mode, setMode] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedDateEntries, setSelectedDateEntries] = useState<WellBeingEntry[]>([]);
  const [selectedDateLoading, setSelectedDateLoading] = useState(false);
  const [selectedDateError, setSelectedDateError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [dateCategoriesMap, setDateCategoriesMap] = useState<Record<string, string[]>>({});
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({
    observation: 'observation',
    symptom: 'symptom',
  });
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const categoryColors = useMemo(() => {
    const keys = Object.keys(categoryLabels).sort();
    const map: Record<string, string> = {};
    keys.forEach((key, index) => {
      map[key] = colorPalette[index % colorPalette.length];
    });
    return map;
  }, [categoryLabels]);

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

      const dateCategoryNotable = new Map<string, Set<string>>();
      relevantEntries.forEach((entry) => {
        if (!hasNotableValue(entry, notableLookup)) {
          return;
        }
        const dateKey = entry.date.slice(0, 10);
        const categoryKey = normaliseCategory(entry.category);
        const set = dateCategoryNotable.get(dateKey) ?? new Set<string>();
        set.add(categoryKey);
        dateCategoryNotable.set(dateKey, set);
      });

      const map: Record<string, string[]> = {};
      dateCategoryNotable.forEach((set, dateKey) => {
        if (set.has('observation') && set.has('symptom')) {
          map[dateKey] = Array.from(set).sort();
        }
      });

      setDateCategoriesMap(map);
      setCategoryLabels((prev) => ({ ...prev, ...labelsUpdate }));
    } catch (error: unknown) {
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
    if (mode === 'calendar' && selectedDate) {
      refreshSelectedDateEntries();
    }
  }, [mode, selectedDate, refreshSelectedDateEntries]);

  const handleEntryDeleted = useCallback(() => {
    refreshSelectedDateEntries();
    if (mode === 'calendar') {
      refreshCalendarData();
    }
  }, [mode, refreshCalendarData, refreshSelectedDateEntries]);

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

      {mode === 'dashboard' ? (
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
