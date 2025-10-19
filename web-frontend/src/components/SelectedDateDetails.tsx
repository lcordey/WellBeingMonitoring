import React, { useMemo, useState } from 'react';
import { deleteWellBeingData, type WellBeingEntry } from '../api';
import {
  splitValuesByNotable,
  type NotableValuesMap,
} from '../utils/notableValues';

interface SelectedDateDetailsProps {
  date?: string;
  entries: WellBeingEntry[];
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEntryDeleted?: (entry: WellBeingEntry) => void;
  notableValuesMap: NotableValuesMap;
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
  notableValuesMap,
}) => {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const handleDelete = async (entry: WellBeingEntry) => {
    if (!date) return;
    if (!window.confirm('Delete this entry? This action cannot be undone.')) {
      return;
    }

    const key = `${entry.date}|${entry.category}|${entry.type}`;
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

  const enhancedEntries = useMemo(
    () =>
      entries.map((entry, index) => {
        const { notableValues, otherValues } = splitValuesByNotable(
          notableValuesMap,
          entry
        );
        return {
          key: `${entry.date}-${entry.category}-${entry.type}-${index}`,
          deleteKey: `${entry.date}|${entry.category}|${entry.type}`,
          entry,
          notableValues,
          otherValues,
          hasNotable: notableValues.length > 0,
        };
      }),
    [entries, notableValuesMap]
  );

  const notableEntries = enhancedEntries.filter((item) => item.hasNotable);
  const regularEntries = enhancedEntries.filter((item) => !item.hasNotable);

  const renderEntry = (item: (typeof enhancedEntries)[number]) => (
    <li key={item.key}>
      <div className="selected-date-details__item">
        <span className="selected-date-details__badge">
          {formatCategory(item.entry.category)}
        </span>
        <div>
          <strong>{item.entry.type}</strong>
          {item.entry.values.length === 0 ? (
            <div className="selected-date-details__value">Values: —</div>
          ) : (
            <div className="selected-date-details__value-group">
              {item.notableValues.length > 0 && (
                <div className="selected-date-details__value-row">
                  <span className="selected-date-details__value-label">Notable</span>
                  <div className="selected-date-details__value-chips">
                    {item.notableValues.map((value, valueIndex) => (
                      <span
                        key={`notable-${value}-${valueIndex}`}
                        className="value-pill value-pill--notable"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.otherValues.length > 0 && (
                <div className="selected-date-details__value-row">
                  <span className="selected-date-details__value-label">Other</span>
                  <div className="selected-date-details__value-chips">
                    {item.otherValues.map((value, valueIndex) => (
                      <span key={`other-${value}-${valueIndex}`} className="value-pill">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="selected-date-details__delete"
          onClick={() => handleDelete(item.entry)}
          disabled={isLoading || deletingKey === item.deleteKey}
        >
          Delete
        </button>
      </div>
    </li>
  );

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
        <div className="selected-date-details__content">
          <section className="selected-date-details__section">
            <h4>Notable data</h4>
            {notableEntries.length > 0 ? (
              <ul className="selected-date-details__list">
                {notableEntries.map((item) => renderEntry(item))}
              </ul>
            ) : (
              <p className="selected-date-details__empty">No notable entries recorded.</p>
            )}
          </section>
          <section className="selected-date-details__section">
            <h4>Other data</h4>
            {regularEntries.length > 0 ? (
              <ul className="selected-date-details__list">
                {regularEntries.map((item) => renderEntry(item))}
              </ul>
            ) : (
              <p className="selected-date-details__empty">No additional entries recorded.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SelectedDateDetails;
