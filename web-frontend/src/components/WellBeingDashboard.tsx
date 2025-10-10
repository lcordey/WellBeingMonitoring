import React, { useEffect, useMemo, useState } from 'react';
import { getAllWellBeingData, type WellBeingEntry } from '../api';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const toCategoryKey = (value: string) => value.trim().toLowerCase();
const toTypeKey = (entry: WellBeingEntry) =>
  `${toCategoryKey(entry.category)}|${entry.type.trim().toLowerCase()}`;

const formatCategoryLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface ChipOption {
  key: string;
  label: string;
}

export const WellBeingDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllWellBeingData({
        startDate,
        endDate,
      });
      setEntries(response);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const categoryLabels = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions.forEach((option) => map.set(option.key, option.label));
    return map;
  }, [categoryOptions]);

  const typeOptions = useMemo<ChipOption[]>(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) => {
      const key = toTypeKey(entry);
      if (!map.has(key)) {
        map.set(key, `${entry.type} (${formatCategoryLabel(entry.category)})`);
      }
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  useEffect(() => {
    setSelectedCategories((prev) =>
      prev.filter((key) => categoryLabels.has(key))
    );
    setSelectedTypes((prev) => prev.filter((key) => typeOptions.some((option) => option.key === key)));
  }, [categoryLabels, typeOptions]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const categoryKey = toCategoryKey(entry.category);
      const typeKey = toTypeKey(entry);
      if (selectedCategories.length > 0 && !selectedCategories.includes(categoryKey)) {
        return false;
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(typeKey)) {
        return false;
      }
      return true;
    });
  }, [entries, selectedCategories, selectedTypes]);

  const totalEntries = filteredEntries.length;
  const uniqueCategoriesCount = useMemo(
    () => new Set(filteredEntries.map((entry) => toCategoryKey(entry.category))).size,
    [filteredEntries]
  );
  const uniqueTypesCount = useMemo(
    () => new Set(filteredEntries.map((entry) => toTypeKey(entry))).size,
    [filteredEntries]
  );
  const totalValuesRecorded = useMemo(
    () => filteredEntries.reduce((sum, entry) => sum + entry.values.length, 0),
    [filteredEntries]
  );
  const trackedDays = useMemo(
    () => new Set(filteredEntries.map((entry) => entry.date)).size,
    [filteredEntries]
  );

  const timeline = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        byCategory: Map<string, number>;
      }
    >();

    for (const entry of filteredEntries) {
      const dateKey = entry.date;
      const categoryKey = toCategoryKey(entry.category);
      if (!map.has(dateKey)) {
        map.set(dateKey, { total: 0, byCategory: new Map() });
      }
      const bucket = map.get(dateKey)!;
      bucket.total += 1;
      const current = bucket.byCategory.get(categoryKey) ?? 0;
      bucket.byCategory.set(categoryKey, current + 1);
    }

    return Array.from(map.entries())
      .map(([date, bucket]) => ({ date, ...bucket }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [filteredEntries]);

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
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2>Well-being dashboard</h2>
          <p className="dashboard__subtitle">
            Inspect activity for the selected period and focus on the categories that matter most.
          </p>
        </div>
        <button className="dashboard__refresh" onClick={fetchDashboardData} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="dashboard__filters">
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
          <div className="dashboard__chips">
            {categoryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleCategory(option.key)}
                className={`dashboard__chip ${selectedCategories.includes(option.key) ? 'dashboard__chip--active' : ''}`}
              >
                {formatCategoryLabel(option.label)}
              </button>
            ))}
          </div>
          <small>Leave empty to include every category.</small>
        </div>
        <div>
          <label>Types</label>
          <div className="dashboard__chips">
            {typeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleType(option.key)}
                className={`dashboard__chip ${selectedTypes.includes(option.key) ? 'dashboard__chip--active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <small>Combine category and type filters for granular insights.</small>
        </div>
      </div>

      {error && <div className="dashboard__error">{error}</div>}

      <div className="dashboard__cards">
        <div className="dashboard__card">
          <span className="dashboard__card-label">Total entries</span>
          <strong className="dashboard__card-value">{totalEntries}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Categories tracked</span>
          <strong className="dashboard__card-value">{uniqueCategoriesCount}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Types represented</span>
          <strong className="dashboard__card-value">{uniqueTypesCount}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Values recorded</span>
          <strong className="dashboard__card-value">{totalValuesRecorded}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Days covered</span>
          <strong className="dashboard__card-value">{trackedDays}</strong>
        </div>
      </div>

      <section className="dashboard__section">
        <h3>Daily summary</h3>
        {timeline.length === 0 ? (
          <p>No data available for the selected period.</p>
        ) : (
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total entries</th>
                <th>Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row) => (
                <tr key={row.date}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>{row.total}</td>
                  <td>
                    {Array.from(row.byCategory.entries())
                      .map(([categoryKey, count]) =>
                        `${formatCategoryLabel(categoryLabels.get(categoryKey) ?? categoryKey)}: ${count}`
                      )
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default WellBeingDashboard;
