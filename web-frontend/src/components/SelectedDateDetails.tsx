import React, { useState } from 'react';
import { deleteWellBeingData, type WellBeingEntry } from '../api';

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
        <ul className="selected-date-details__list">
          {entries.map((entry, index) => (
            <li key={`${entry.date}-${entry.category}-${entry.type}-${index}`}>
              <div className="selected-date-details__item">
                <span className="selected-date-details__badge">{formatCategory(entry.category)}</span>
                <div>
                  <strong>{entry.type}</strong>
                  <div className="selected-date-details__value">
                    Values: {entry.values.length ? entry.values.join(', ') : '—'}
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
    </div>
  );
};

export default SelectedDateDetails;
