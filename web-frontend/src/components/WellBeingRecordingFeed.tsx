import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addWellBeingData,
  getAllWellBeingData,
  getWellBeingCategoryTypes,
  getWellBeingDefinitions,
  type WellBeingCategoryTypes,
  type WellBeingDefinition,
  type WellBeingDefinitionValue,
  type WellBeingEntry,
} from '../api';
import { normaliseCategoryKey, normaliseTypeKey } from '../utils/notable';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS_RANGE = 7;
const MAX_DAYS_RANGE = 120;
const PAGE_SIZE = 12;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const toDateKey = (date: Date) => {
  const copy = new Date(date.getTime());
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
};

const parseDateKey = (value: string): Date | null => {
  if (!/\d{4}-\d{2}-\d{2}/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(12, 0, 0, 0);
  return date;
};

const createDescendingDateKeys = (startKey: string, endKey: string): string[] => {
  const startDate = parseDateKey(startKey);
  const endDate = parseDateKey(endKey);
  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const keys: string[] = [];
  const cursor = new Date(endDate.getTime());
  while (cursor >= startDate) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return keys;
};

const formatDateForDisplay = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeDate = (dateKey: string, todayKey: string) => {
  if (dateKey === todayKey) {
    return 'Today';
  }
  const today = parseDateKey(todayKey);
  const date = parseDateKey(dateKey);
  if (!today || !date) {
    return dateKey;
  }
  const diffDays = Math.round((today.getTime() - date.getTime()) / MS_PER_DAY);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

type RangeMode = 'days' | 'date';

interface CategoryTypeEntry {
  category: string;
  categoryKey: string;
  type: string;
  typeKey: string;
}

interface MissingItem extends CategoryTypeEntry {
  id: string;
  date: string;
}

interface StartDateResult {
  startDateKey: string | null;
  message: string | null;
  daysUsed: number | null;
}

const sanitiseDays = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAYS_RANGE;
  }
  const rounded = Math.floor(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > MAX_DAYS_RANGE) {
    return MAX_DAYS_RANGE;
  }
  return rounded;
};

const getStartDateResult = (
  mode: RangeMode,
  todayKey: string,
  daysBack: number,
  startDateInput: string
): StartDateResult => {
  const today = parseDateKey(todayKey);
  if (!today) {
    return {
      startDateKey: null,
      message: "Unable to determine today's date.",
      daysUsed: null,
    };
  }

  if (mode === 'days') {
    const normalisedDays = sanitiseDays(daysBack);
    const start = new Date(today.getTime());
    start.setDate(start.getDate() - (normalisedDays - 1));
    return {
      startDateKey: toDateKey(start),
      message:
        daysBack !== normalisedDays && normalisedDays === MAX_DAYS_RANGE
          ? `Limiting the range to ${MAX_DAYS_RANGE} days to keep the feed manageable.`
          : null,
      daysUsed: normalisedDays,
    };
  }

  if (!startDateInput) {
    return {
      startDateKey: null,
      message: 'Select a start date to show pending entries.',
      daysUsed: null,
    };
  }

  const parsed = parseDateKey(startDateInput);
  if (!parsed) {
    return {
      startDateKey: null,
      message: 'Select a valid start date.',
      daysUsed: null,
    };
  }

  if (parsed > today) {
    return {
      startDateKey: todayKey,
      message: 'The start date cannot be in the future. Showing entries starting today.',
      daysUsed: null,
    };
  }

  return { startDateKey: toDateKey(parsed), message: null, daysUsed: null };
};

interface QuickRecordFormProps {
  item: MissingItem;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  fetchDefinitions: (category: string) => Promise<WellBeingDefinition[]>;
}

const QuickRecordForm: React.FC<QuickRecordFormProps> = ({
  item,
  onClose,
  onSaved,
  fetchDefinitions,
}) => {
  const [definition, setDefinition] = useState<WellBeingDefinition | null>(null);
  const [availableValues, setAvailableValues] = useState<WellBeingDefinitionValue[]>([]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDefinition(null);
    setAvailableValues([]);
    setAllowMultiple(false);
    setSelectedValues([]);
    setError(null);
    setSubmitError(null);
    setLoadingDefinition(true);

    const loadDefinitions = async () => {
      try {
        const definitions = await fetchDefinitions(item.category);
        if (cancelled) return;
        const matching = definitions.find(
          (definitionItem) => normaliseTypeKey(definitionItem.type) === item.typeKey
        );
        if (!matching) {
          setError('This type has no definition yet. Configure it on the definitions page.');
          return;
        }
        setDefinition(matching);
        setAvailableValues(matching.values ?? []);
        setAllowMultiple(Boolean(matching.allowMultiple));
      } catch (err: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(err, 'Unable to load the definition for this type.'));
      } finally {
        if (!cancelled) {
          setLoadingDefinition(false);
        }
      }
    };

    void loadDefinitions();

    return () => {
      cancelled = true;
    };
  }, [fetchDefinitions, item]);

  const toggleValue = (value: string) => {
    setSelectedValues((prev) => {
      if (allowMultiple) {
        return prev.includes(value)
          ? prev.filter((itemValue) => itemValue !== value)
          : [...prev, value];
      }
      return prev.includes(value) ? [] : [value];
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!definition) {
      setSubmitError('Select a value before saving.');
      return;
    }
    if (selectedValues.length === 0) {
      setSubmitError('Select at least one value to record the entry.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addWellBeingData({
        date: item.date,
        category: item.category,
        type: item.type,
        values: selectedValues,
      });
      await onSaved();
      onClose();
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Unable to save the entry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="record-feed__form">
      {loadingDefinition ? (
        <p className="record-feed__form-info">Loading definition…</p>
      ) : error ? (
        <div className="record-feed__form-error">{error}</div>
      ) : (
        <>
          <div className="record-feed__form-header">
            <h4>
              {item.category} — {item.type}
            </h4>
            <span>{formatDateForDisplay(item.date)}</span>
          </div>
          {availableValues.length > 0 ? (
            <div className="record-feed__values" role="group" aria-label="Values">
              {availableValues.map((value) => {
                const isSelected = selectedValues.includes(value.value);
                return (
                  <button
                    key={value.value}
                    type="button"
                    className={`data-entry__chip ${isSelected ? 'data-entry__chip--active' : ''}`}
                    onClick={() => toggleValue(value.value)}
                  >
                    {value.value}
                    {value.noticeable && <span className="data-entry__chip-badge">notable</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="record-feed__form-info">
              This type does not have predefined values yet.
            </p>
          )}
          {submitError && <div className="record-feed__form-error">{submitError}</div>}
          <div className="record-feed__form-actions">
            <button type="button" onClick={onClose} className="record-feed__secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || loadingDefinition || availableValues.length === 0}
            >
              Save entry
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const WellBeingRecordingFeed: React.FC = () => {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const todayDate = useMemo(() => parseDateKey(todayKey) ?? new Date(), [todayKey]);

  const [mode, setMode] = useState<RangeMode>('days');
  const [daysBack, setDaysBack] = useState<number>(DEFAULT_DAYS_RANGE);
  const [startDateInput, setStartDateInput] = useState<string>(() => {
    const start = new Date(todayDate.getTime());
    start.setDate(start.getDate() - (DEFAULT_DAYS_RANGE - 1));
    return toDateKey(start);
  });

  const [catalogue, setCatalogue] = useState<WellBeingCategoryTypes[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const definitionsCacheRef = useRef<Map<string, WellBeingDefinition[]>>(new Map());

  const startDateResult = useMemo(
    () => getStartDateResult(mode, todayKey, daysBack, startDateInput),
    [mode, todayKey, daysBack, startDateInput]
  );

  const startDateKey = startDateResult.startDateKey;
  const rangeMessage = startDateResult.message;
  const daysUsed = startDateResult.daysUsed;

  const fetchDefinitionsForCategory = useCallback(
    async (category: string) => {
      const cacheKey = normaliseCategoryKey(category);
      const cached = definitionsCacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }
      const definitions = await getWellBeingDefinitions(category);
      definitionsCacheRef.current.set(cacheKey, definitions);
      return definitions;
    },
    []
  );

  const refreshCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setCatalogueError(null);
    try {
      const data = await getWellBeingCategoryTypes();
      setCatalogue(data);
    } catch (error: unknown) {
      setCatalogue([]);
      setCatalogueError(
        getErrorMessage(error, 'Unable to load the list of categories and types.')
      );
    } finally {
      setCatalogueLoading(false);
    }
  }, []);

  const refreshEntries = useCallback(async () => {
    if (!startDateKey) {
      setEntries([]);
      return;
    }
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const data = await getAllWellBeingData({ startDate: startDateKey, endDate: todayKey });
      setEntries(data);
    } catch (error: unknown) {
      setEntries([]);
      setEntriesError(getErrorMessage(error, 'Unable to load existing entries.'));
    } finally {
      setEntriesLoading(false);
    }
  }, [startDateKey, todayKey]);

  const handleRefreshAll = useCallback(() => {
    definitionsCacheRef.current.clear();
    void refreshCatalogue();
    void refreshEntries();
  }, [refreshCatalogue, refreshEntries]);

  useEffect(() => {
    void refreshCatalogue();
  }, [refreshCatalogue]);

  useEffect(() => {
    void refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setActiveItemId(null);
  }, [startDateKey]);

  const categoryTypeEntries = useMemo(() => {
    const map = new Map<string, CategoryTypeEntry>();

    catalogue.forEach((entry) => {
      const categoryKey = normaliseCategoryKey(entry.category);
      const category = entry.category;
      entry.types.forEach((type) => {
        const typeKey = normaliseTypeKey(type);
        if (!typeKey) {
          return;
        }
        const key = `${categoryKey}__${typeKey}`;
        if (!map.has(key)) {
          map.set(key, {
            category,
            categoryKey,
            type,
            typeKey,
          });
        }
      });
    });

    entries.forEach((entry) => {
      const categoryKey = normaliseCategoryKey(entry.category);
      const typeKey = normaliseTypeKey(entry.type);
      if (!categoryKey || !typeKey) {
        return;
      }
      const key = `${categoryKey}__${typeKey}`;
      if (!map.has(key)) {
        map.set(key, {
          category: entry.category,
          categoryKey,
          type: entry.type,
          typeKey,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.category.toLowerCase() === b.category.toLowerCase()) {
        return a.type.localeCompare(b.type);
      }
      return a.category.localeCompare(b.category);
    });
  }, [catalogue, entries]);

  const recordedKeys = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((entry) => {
      const dateKey = entry.date?.slice(0, 10);
      const categoryKey = normaliseCategoryKey(entry.category);
      const typeKey = normaliseTypeKey(entry.type);
      if (!dateKey || !categoryKey || !typeKey) {
        return;
      }
      set.add(`${dateKey}|${categoryKey}|${typeKey}`);
    });
    return set;
  }, [entries]);

  const dateKeys = useMemo(() => {
    if (!startDateKey) {
      return [];
    }
    return createDescendingDateKeys(startDateKey, todayKey);
  }, [startDateKey, todayKey]);

  const missingItems = useMemo(() => {
    if (dateKeys.length === 0 || categoryTypeEntries.length === 0) {
      return [];
    }

    const list: MissingItem[] = [];
    dateKeys.forEach((dateKey) => {
      categoryTypeEntries.forEach((entry) => {
        const id = `${dateKey}|${entry.categoryKey}|${entry.typeKey}`;
        if (!recordedKeys.has(id)) {
          list.push({
            ...entry,
            id,
            date: dateKey,
          });
        }
      });
    });

    return list;
  }, [dateKeys, categoryTypeEntries, recordedKeys]);

  const uniqueMissingDays = useMemo(() => {
    const set = new Set<string>();
    missingItems.forEach((item) => set.add(item.date));
    return set.size;
  }, [missingItems]);

  const visibleItems = useMemo(() => {
    const limit = Math.min(visibleCount, missingItems.length);
    return missingItems.slice(0, limit);
  }, [missingItems, visibleCount]);

  const canLoadMore = visibleCount < missingItems.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const activeItem = useMemo(
    () => visibleItems.find((item) => item.id === activeItemId) ?? null,
    [activeItemId, visibleItems]
  );

  return (
    <div className="record-feed">
      <div className="record-feed__header">
        <div>
          <h2>Record your data</h2>
          <p className="record-feed__subtitle">
            Fill in the categories and types you have not captured yet for today and earlier days.
          </p>
        </div>
        <button type="button" onClick={handleRefreshAll} className="record-feed__refresh">
          Refresh data
        </button>
      </div>

      <section className="record-feed__config">
        <h3>Tracking window</h3>
        <div className="record-feed__mode-toggle" role="group" aria-label="Tracking mode">
          <button
            type="button"
            className={`record-feed__mode${mode === 'days' ? ' record-feed__mode--active' : ''}`}
            onClick={() => setMode('days')}
          >
            Last N days
          </button>
          <button
            type="button"
            className={`record-feed__mode${mode === 'date' ? ' record-feed__mode--active' : ''}`}
            onClick={() => setMode('date')}
          >
            Since a date
          </button>
        </div>
        {mode === 'days' ? (
          <label className="record-feed__field">
            <span>Number of days to review</span>
            <input
              type="number"
              min={1}
              max={MAX_DAYS_RANGE}
              value={daysBack}
              onChange={(event) => setDaysBack(sanitiseDays(Number(event.target.value)))}
            />
          </label>
        ) : (
          <label className="record-feed__field">
            <span>Start date</span>
            <input
              type="date"
              value={startDateInput}
              max={todayKey}
              onChange={(event) => setStartDateInput(event.target.value)}
            />
          </label>
        )}
        <p className="record-feed__range-info">
          {startDateKey
            ? `Showing entries from ${formatDateForDisplay(startDateKey)} to ${formatDateForDisplay(todayKey)}.`
            : 'Choose a range to see pending entries.'}
        </p>
        {rangeMessage && <p className="record-feed__hint">{rangeMessage}</p>}
        {mode === 'days' && daysUsed !== null && (
          <p className="record-feed__hint">Tracking the last {daysUsed} days.</p>
        )}
      </section>

      {catalogueError && <div className="record-feed__error">{catalogueError}</div>}
      {entriesError && <div className="record-feed__error">{entriesError}</div>}

      {(catalogueLoading || entriesLoading) && (
        <p className="record-feed__info">Loading data…</p>
      )}

      {startDateKey && categoryTypeEntries.length === 0 && !catalogueLoading && (
        <p className="record-feed__info">
          No categories or types available yet. Configure them on the definitions page first.
        </p>
      )}

      {startDateKey && categoryTypeEntries.length > 0 && (
        <section className="record-feed__summary">
          {missingItems.length > 0 ? (
            <p>
              {missingItems.length} entries pending across {uniqueMissingDays} day
              {uniqueMissingDays === 1 ? '' : 's'}.
            </p>
          ) : (
            <p>You are all caught up for the selected period. 🎉</p>
          )}
        </section>
      )}

      {missingItems.length > 0 && (
        <div className="record-feed__list">
          {visibleItems.map((item, index) => {
            const previous = visibleItems[index - 1];
            const showDateHeader = !previous || previous.date !== item.date;
            return (
              <div key={item.id} className="record-feed__entry">
                {showDateHeader && (
                  <div className="record-feed__date">
                    <strong>{formatRelativeDate(item.date, todayKey)}</strong>
                    <span>{formatDateForDisplay(item.date)}</span>
                  </div>
                )}
                <div className="record-feed__entry-body">
                  <div>
                    <div className="record-feed__entry-category">{item.category}</div>
                    <div className="record-feed__entry-type">{item.type}</div>
                  </div>
                  <button
                    type="button"
                    className="record-feed__action"
                    onClick={() => setActiveItemId((prev) => (prev === item.id ? null : item.id))}
                  >
                    {activeItemId === item.id ? 'Close' : 'Record now'}
                  </button>
                </div>
                {activeItemId === item.id && activeItem && (
                  <QuickRecordForm
                    item={activeItem}
                    onClose={() => setActiveItemId(null)}
                    onSaved={refreshEntries}
                    fetchDefinitions={fetchDefinitionsForCategory}
                  />
                )}
              </div>
            );
          })}
          {canLoadMore && (
            <div className="record-feed__actions">
              <button type="button" onClick={handleShowMore}>
                Show more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WellBeingRecordingFeed;
