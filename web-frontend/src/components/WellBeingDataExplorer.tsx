import React, { useEffect, useMemo, useState } from 'react';
import { getAllData, type WellBeingEntry } from '../api';
import { ObservationType, SymptomType } from '../types/enums';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getEnumValues = <T extends Record<string, string>>(enumeration: T) =>
  Object.values(enumeration).filter((value): value is T[keyof T] => typeof value === 'string');

type DataTypeFilter = 'all' | 'observation' | 'symptom';

const isObservationEntry = (entry: WellBeingEntry): entry is Extract<WellBeingEntry, { dataType: 'observation' }> =>
  entry.dataType === 'observation';

const isSymptomEntry = (entry: WellBeingEntry): entry is Extract<WellBeingEntry, { dataType: 'symptom' }> =>
  entry.dataType === 'symptom';

export const WellBeingDataExplorer: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [dataTypeFilter, setDataTypeFilter] = useState<DataTypeFilter>('all');
  const [observationFilters, setObservationFilters] = useState<ObservationType[]>([]);
  const [symptomFilters, setSymptomFilters] = useState<SymptomType[]>([]);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observationOptions = useMemo(() => getEnumValues(ObservationType), []);
  const symptomOptions = useMemo(() => getEnumValues(SymptomType), []);

  const fetchData = async () => {
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
      setError(err.message ?? 'Unable to retrieve data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const filteredEntries = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return entries
      .filter((entry) => {
        if (dataTypeFilter !== 'all' && entry.dataType !== dataTypeFilter) {
          return false;
        }
        if (observationFilters.length && isObservationEntry(entry) && !observationFilters.includes(entry.observationType)) {
          return false;
        }
        if (symptomFilters.length && isSymptomEntry(entry) && !symptomFilters.includes(entry.symptomType)) {
          return false;
        }

        if (!loweredQuery) return true;

        const observationLabel = isObservationEntry(entry) ? entry.observationType : undefined;
        const symptomLabel = isSymptomEntry(entry) ? entry.symptomType : undefined;

        const fields = [
          entry.date,
          entry.dataType,
          observationLabel,
          symptomLabel,
          entry.value,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return fields.some((field) => field.includes(loweredQuery));
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [entries, dataTypeFilter, observationFilters, symptomFilters, query]);

  return (
    <div className="data-explorer">
      <div className="data-explorer__header">
        <div>
          <h2>Data Explorer</h2>
          <p className="data-explorer__subtitle">
            Inspect raw well-being entries, filter by category, and search for specific information.
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
          <label>Data type</label>
          <div className="data-explorer__inline-options">
            {(['all', 'observation', 'symptom'] as DataTypeFilter[]).map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  value={type}
                  checked={dataTypeFilter === type}
                  onChange={() => setDataTypeFilter(type)}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label>Observation filters</label>
          <div className="data-explorer__chips">
            {observationOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={`data-explorer__chip ${observationFilters.includes(type) ? 'data-explorer__chip--active' : ''}`}
                onClick={() => toggleObservationFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Symptom filters</label>
          <div className="data-explorer__chips">
            {symptomOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={`data-explorer__chip ${symptomFilters.includes(type) ? 'data-explorer__chip--active' : ''}`}
                onClick={() => toggleSymptomFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Search</label>
          <input
            type="search"
            placeholder="Search type, value, or date"
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
                  <th>Type</th>
                  <th>Category</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => {
                  const observationLabel = isObservationEntry(entry) ? entry.observationType : undefined;
                  const symptomLabel = isSymptomEntry(entry) ? entry.symptomType : undefined;
                  return (
                    <tr key={`${entry.date}-${entry.dataType}-${index}`}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td>{entry.dataType}</td>
                      <td>{observationLabel ?? symptomLabel ?? '—'}</td>
                      <td>{entry.value === null || entry.value === undefined ? '—' : String(entry.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default WellBeingDataExplorer;
