import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteWellBeingData,
  getAllWellBeingData,
  getWellBeingDefinitions,
  type WellBeingEntry,
} from '../api';
import {
  buildNotableValuesMap,
  isValueNotable,
  type NotableValuesMap,
} from '../utils/notableValues';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const toCategoryKey = (value: string) => value.trim().toLowerCase();
const toTypeKey = (entry: WellBeingEntry) =>
  `${toCategoryKey(entry.category)}|${entry.type.trim().toLowerCase()}`;

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

interface ChipOption {
  key: string;
  label: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const WellBeingDataExplorer: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [notableValuesMap, setNotableValuesMap] = useState<NotableValuesMap>({});

  const updateNotableValues = useCallback(async (entriesList: WellBeingEntry[]) => {
    const categories = Array.from(
      new Set(
        entriesList
          .map((entry) => entry.category)
          .filter((value) => value && value.trim().length > 0)
      )
    );

    if (categories.length === 0) {
      setNotableValuesMap({});
      return;
    }

    const definitionsResults = await Promise.all(
      categories.map(async (category) => {
        try {
          const definitions = await getWellBeingDefinitions(category);
          return { category, definitions };
        } catch (error) {
          console.warn('Failed to load definitions for category', category, error);
          return { category, definitions: [] };
        }
      })
    );

    setNotableValuesMap(buildNotableValuesMap(definitionsResults));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    try {
      const response = await getAllWellBeingData({
        startDate,
        endDate,
      });
      setEntries(response);
      await updateNotableValues(response);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to retrieve data.'));
      setNotableValuesMap({});
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, updateNotableValues]);

  const handleDelete = useCallback(
    async (entry: WellBeingEntry) => {
      if (!window.confirm('Delete this entry? This action cannot be undone.')) {
        return;
      }

      const key = `${entry.date}|${entry.category}|${entry.type}`;
      setDeletingKey(key);
      setDeleteError(null);
      try {
        await deleteWellBeingData({
          date: entry.date,
          category: entry.category,
          type: entry.type,
        });
        await fetchData();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Unable to delete the entry.');
        setDeleteError(message);
      } finally {
        setDeletingKey(null);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const categoryOptions = useMemo<ChipOption[]>(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) => {
      const key = toCategoryKey(entry.category);
      if (!map.has(key)) {
        map.set(key, entry.category);
      }
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const typeOptions = useMemo<ChipOption[]>(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) => {
      const key = toTypeKey(entry);
      if (!map.has(key)) {
        map.set(key, `${entry.type} (${formatLabel(entry.category)})`);
      }
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  useEffect(() => {
    setSelectedCategories((prev) =>
      prev.filter((key) => categoryOptions.some((option) => option.key === key))
    );
    setSelectedTypes((prev) => prev.filter((key) => typeOptions.some((option) => option.key === key)));
  }, [categoryOptions, typeOptions]);

  const filteredEntries = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const categoryKey = toCategoryKey(entry.category);
        const typeKey = toTypeKey(entry);
        if (selectedCategories.length > 0 && !selectedCategories.includes(categoryKey)) {
          return false;
        }
        if (selectedTypes.length > 0 && !selectedTypes.includes(typeKey)) {
          return false;
        }
        if (!loweredQuery) return true;

        const fields = [
          entry.date,
          entry.category,
          entry.type,
          ...entry.values,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return fields.some((field) => field.includes(loweredQuery));
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [entries, selectedCategories, selectedTypes, query]);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]
    );
  };

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]
    );
  };

  return (
    <div className="data-explorer">
      <div className="data-explorer__header">
        <div>
          <h2>Data explorer</h2>
          <p className="data-explorer__subtitle">
            Inspect raw entries, refine the view with filters, and search across recorded values.
          </p>
        </div>
        <button onClick={fetchData} className="data-explorer__refresh" disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="data-explorer__filters">
        <div>
          <label>Start date</label>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div>
          <label>End date</label>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
        <div>
          <label>Categories</label>
          <div className="data-explorer__chips">
            {categoryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`data-explorer__chip ${selectedCategories.includes(option.key) ? 'data-explorer__chip--active' : ''}`}
                onClick={() => toggleCategory(option.key)}
              >
                {formatLabel(option.label)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Types</label>
          <div className="data-explorer__chips">
            {typeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`data-explorer__chip ${selectedTypes.includes(option.key) ? 'data-explorer__chip--active' : ''}`}
                onClick={() => toggleType(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Search</label>
          <input
            type="search"
            placeholder="Search by category, type, value, or date"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      {error && <div className="data-explorer__error">{error}</div>}

      <section className="data-explorer__section">
        <h3>Entries</h3>
        {loading ? (
          <p>Loading data…</p>
        ) : filteredEntries.length === 0 ? (
          <p>No entries match the selected filters.</p>
        ) : (
          <div className="data-explorer__table-wrapper">
            <table className="data-explorer__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Values</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => {
                  const deleteKey = `${entry.date}|${entry.category}|${entry.type}`;
                  return (
                    <tr key={`${entry.date}-${entry.category}-${entry.type}-${index}`}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td>{formatLabel(entry.category)}</td>
                      <td>{entry.type}</td>
                      <td>
                        {entry.values.length ? (
                          <div className="data-explorer__value-group">
                            {entry.values.map((value, valueIndex) => {
                              const notable = isValueNotable(
                                notableValuesMap,
                                entry.category,
                                entry.type,
                                value
                              );
                              return (
                                <span
                                  key={`${value}-${valueIndex}`}
                                  className={`value-pill${notable ? ' value-pill--notable' : ''}`}
                                >
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="data-explorer__delete"
                          onClick={() => handleDelete(entry)}
                          disabled={loading || deletingKey === deleteKey}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {deleteError && <div className="data-explorer__error">{deleteError}</div>}
    </div>
  );
};

export default WellBeingDataExplorer;
