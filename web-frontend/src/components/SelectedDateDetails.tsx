import React, { useEffect, useMemo, useState } from 'react';
import { deleteWellBeingData, type WellBeingEntry } from '../api';
import {
  fetchNotableLookup,
  hasNotableValue,
  splitEntryValues,
  type EntryValueSplit,
  type NotableValueLookup,
} from '../utils/notable';

interface SelectedDateDetailsProps {
  date?: string;
  entries: WellBeingEntry[];
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEntryDeleted?: (entry: WellBeingEntry) => void;
}

const formatCategory = (category: string) =>
  category ? category.charAt(0).toUpperCase() + category.slice(1) : category;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to delete the entry.';

export const SelectedDateDetails: React.FC<SelectedDateDetailsProps> = ({
  date,
  entries,
  isLoading,
  error,
  onRefresh,
  onEntryDeleted,
}) => {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [notableLookup, setNotableLookup] = useState<NotableValueLookup>({});

  useEffect(() => {
    let cancelled = false;
    if (!entries.length) {
      setNotableLookup({});
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const lookup = await fetchNotableLookup(entries);
        if (!cancelled) {
          setNotableLookup(lookup);
        }
      } catch (err) {
        console.error('Unable to load notable values for selected date view', err);
        if (!cancelled) {
          setNotableLookup({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  interface DetailedEntry {
    entry: WellBeingEntry;
    split: EntryValueSplit;
  }

  const { notableEntries, regularEntries } = useMemo(() => {
    const grouped: { notableEntries: DetailedEntry[]; regularEntries: DetailedEntry[] } = {
      notableEntries: [],
      regularEntries: [],
    };

    entries.forEach((entry) => {
      const split = splitEntryValues(entry, notableLookup);
      const container = hasNotableValue(entry, notableLookup)
        ? grouped.notableEntries
        : grouped.regularEntries;
      container.push({ entry, split });
    });

    return grouped;
  }, [entries, notableLookup]);

  const handleDelete = async (entry: WellBeingEntry) => {
    if (!date) return;
    if (!window.confirm('Delete this entry? This action cannot be undone.')) {
      return;
    }

    const key = `${entry.category}|${entry.type}`;
    setDeleteError(null);
    setDeletingKey(key);
    try {
      await deleteWellBeingData({
        date: entry.date,
        category: entry.category,
        type: entry.type,
      });
      onEntryDeleted?.(entry);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeletingKey(null);
    }
  };

  if (!date) {
    return (
      <div className="selected-date-details">
        <h3>Pick a day to view its details</h3>
        <p>Select any highlighted date in the calendar to inspect the recorded information.</p>
      </div>
    );
  }

  return (
      <div className="selected-date-details">
      <div className="selected-date-details__header">
        <div>
          <h3>Details for {new Date(date).toLocaleDateString()}</h3>
          <p>
            {entries.length
              ? `${entries.length} entr${entries.length > 1 ? 'ies' : 'y'} recorded`
              : 'No entries recorded.'}
          </p>
        </div>
        <button className="selected-date-details__refresh" onClick={onRefresh} disabled={isLoading}>
          Refresh
        </button>
      </div>
      {isLoading && <div className="selected-date-details__loading">Loading data…</div>}
      {error && <div className="selected-date-details__error">{error}</div>}
      {deleteError && <div className="selected-date-details__error">{deleteError}</div>}
      {!isLoading && !error && (
        <>
          <section className="selected-date-details__section selected-date-details__section--notable">
            <h4 className="selected-date-details__section-title">Notable entries</h4>
            {notableEntries.length === 0 ? (
              <p className="selected-date-details__empty">No notable values captured on this date.</p>
            ) : (
              <ul className="selected-date-details__list">
                {notableEntries.map(({ entry, split }, index) => (
                  <li key={`${entry.date}-${entry.category}-${entry.type}-notable-${index}`}>
                    <div className="selected-date-details__item">
                      <span className="selected-date-details__badge">{formatCategory(entry.category)}</span>
                      <div className="selected-date-details__item-details">
                        <strong>{entry.type}</strong>
                        <div className="selected-date-details__values">
                          {split.notableValues.map((value, valueIndex) => (
                            <span
                              key={`${value}-notable-${valueIndex}`}
                              className="selected-date-details__value-pill selected-date-details__value-pill--notable"
                            >
                              {value}
                            </span>
                          ))}
                          {split.regularValues.map((value, valueIndex) => (
                            <span
                              key={`${value}-regular-${valueIndex}`}
                              className="selected-date-details__value-pill"
                            >
                              {value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="selected-date-details__delete"
                        onClick={() => handleDelete(entry)}
                        disabled={isLoading || deletingKey === `${entry.category}|${entry.type}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="selected-date-details__section">
            <h4 className="selected-date-details__section-title">Other entries</h4>
            {regularEntries.length === 0 ? (
              <p className="selected-date-details__empty">No additional data recorded.</p>
            ) : (
              <ul className="selected-date-details__list">
                {regularEntries.map(({ entry, split }, index) => (
                  <li key={`${entry.date}-${entry.category}-${entry.type}-regular-${index}`}>
                    <div className="selected-date-details__item">
                      <span className="selected-date-details__badge">{formatCategory(entry.category)}</span>
                      <div className="selected-date-details__item-details">
                        <strong>{entry.type}</strong>
                        <div className="selected-date-details__values">
                          {split.regularValues.length > 0 ? (
                            split.regularValues.map((value, valueIndex) => (
                              <span
                                key={`${value}-regular-only-${valueIndex}`}
                                className="selected-date-details__value-pill"
                              >
                                {value}
                              </span>
                            ))
                          ) : (
                            <span className="selected-date-details__value-pill selected-date-details__value-pill--empty">—</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="selected-date-details__delete"
                        onClick={() => handleDelete(entry)}
                        disabled={isLoading || deletingKey === `${entry.category}|${entry.type}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default SelectedDateDetails;
