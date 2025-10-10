import React, { useEffect, useMemo, useState } from 'react';
import { getAllData, type WellBeingEntry } from '../api';
import { ObservationType, SymptomType } from '../types/enums';

const getEnumValues = <T extends Record<string, string>>(enumeration: T) =>
  Object.values(enumeration).filter((value): value is T[keyof T] => typeof value === 'string');

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getNumericValue = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

export const WellBeingDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [observationFilters, setObservationFilters] = useState<ObservationType[]>([]);
  const [symptomFilters, setSymptomFilters] = useState<SymptomType[]>([]);
  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observationOptions = useMemo(() => getEnumValues(ObservationType), []);
  const symptomOptions = useMemo(() => getEnumValues(SymptomType), []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllData({
        startDate,
        endDate,
        observationType: observationFilters.length ? observationFilters : undefined,
        symptomType: symptomFilters.length ? symptomFilters : undefined,
      });
      setEntries(response);
    } catch (err: any) {
      setError(err.message ?? 'Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const observationEntries = useMemo(
    () => entries.filter((entry) => entry.dataType === 'observation'),
    [entries]
  );
  const symptomEntries = useMemo(
    () => entries.filter((entry) => entry.dataType === 'symptom'),
    [entries]
  );

  const averageObservationValue = useMemo(() => {
    const values = observationEntries
      .map((entry) => getNumericValue(entry.value))
      .filter((value): value is number => value !== null);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [observationEntries]);

  const averageSymptomValue = useMemo(() => {
    const values = symptomEntries
      .map((entry) => getNumericValue(entry.value))
      .filter((value): value is number => value !== null);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [symptomEntries]);

  const timeline = useMemo(() => {
    const map = new Map<
      string,
      {
        observationCount: number;
        symptomCount: number;
      }
    >();

    for (const entry of entries) {
      if (!map.has(entry.date)) {
        map.set(entry.date, { observationCount: 0, symptomCount: 0 });
      }
      const bucket = map.get(entry.date)!;
      if (entry.dataType === 'observation') {
        bucket.observationCount += 1;
      } else {
        bucket.symptomCount += 1;
      }
    }

    return Array.from(map.entries())
      .map(([date, bucket]) => ({ date, ...bucket }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [entries]);

  const toggleObservationFilter = (type: ObservationType) => {
    setObservationFilters((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]
    );
  };

  const toggleSymptomFilter = (type: SymptomType) => {
    setSymptomFilters((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2>Well-Being Dashboard</h2>
          <p className="dashboard__subtitle">
            Overview of the collected observations and symptoms in the selected period.
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
          <label>Observation filters</label>
          <div className="dashboard__chips">
            {observationOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleObservationFilter(type)}
                className={`dashboard__chip ${observationFilters.includes(type) ? 'dashboard__chip--active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
          <small>Empty selection means “all observations”.</small>
        </div>
        <div>
          <label>Symptom filters</label>
          <div className="dashboard__chips">
            {symptomOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleSymptomFilter(type)}
                className={`dashboard__chip ${symptomFilters.includes(type) ? 'dashboard__chip--active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
          <small>Empty selection means “all symptoms”.</small>
        </div>
      </div>

      {error && <div className="dashboard__error">{error}</div>}

      <div className="dashboard__cards">
        <div className="dashboard__card">
          <span className="dashboard__card-label">Total entries</span>
          <strong className="dashboard__card-value">{entries.length}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Observations</span>
          <strong className="dashboard__card-value">{observationEntries.length}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Symptoms</span>
          <strong className="dashboard__card-value">{symptomEntries.length}</strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Average observation value</span>
          <strong className="dashboard__card-value">
            {averageObservationValue === null ? 'N/A' : averageObservationValue.toFixed(1)}
          </strong>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__card-label">Average symptom value</span>
          <strong className="dashboard__card-value">
            {averageSymptomValue === null ? 'N/A' : averageSymptomValue.toFixed(1)}
          </strong>
        </div>
      </div>

      <section className="dashboard__section">
        <h3>Daily activity</h3>
        {timeline.length === 0 ? (
          <p>No data available for the selected period.</p>
        ) : (
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Observations</th>
                <th>Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row) => (
                <tr key={row.date}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>{row.observationCount}</td>
                  <td>{row.symptomCount}</td>
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
