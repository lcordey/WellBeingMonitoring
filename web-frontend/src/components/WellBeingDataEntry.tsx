import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addWellBeingData,
  getWellBeingDefinitions,
  type WellBeingDefinition,
} from '../api';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const normaliseKey = (value: string) => value.trim().toLowerCase();
interface CategoryDefinitions {
  label: string;
  definitions: WellBeingDefinition[];
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const WellBeingDataEntry: React.FC = () => {
  const today = new Date();
  const [date, setDate] = useState(() => toDateInputValue(today));
  const [category, setCategory] = useState('observation');
  const [type, setType] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState('');
  const [definitionsByCategory, setDefinitionsByCategory] = useState<
    Record<string, CategoryDefinitions>
  >({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryKey = normaliseKey(category);

  const knownCategories = useMemo(() => {
    const entries = new Map<string, string>();
    entries.set(normaliseKey('observation'), 'observation');
    entries.set(normaliseKey('symptom'), 'symptom');
    Object.values(definitionsByCategory).forEach((item) => {
      entries.set(normaliseKey(item.label), item.label);
    });
    return Array.from(new Set(entries.values())).sort();
  }, [definitionsByCategory]);

  const definitionsForCategory = useMemo(
    () => definitionsByCategory[categoryKey]?.definitions ?? [],
    [definitionsByCategory, categoryKey]
  );

  const selectedDefinition = useMemo(
    () =>
      definitionsForCategory.find(
        (definition) => normaliseKey(definition.type) === normaliseKey(type)
      ) ?? null,
    [definitionsForCategory, type]
  );

  const availableValues = useMemo(
    () => selectedDefinition?.values ?? [],
    [selectedDefinition]
  );
  const allowMultiple = selectedDefinition?.allowMultiple ?? false;

  const typeOptions = useMemo(
    () => definitionsForCategory.map((definition) => definition.type).sort(),
    [definitionsForCategory]
  );

  const fetchDefinitions = useCallback(
    async (categoryName: string) => {
      const key = normaliseKey(categoryName);
      if (loadingDefinitions) return;
      setLoadingDefinitions(true);
      setError(null);
      try {
        const definitions = await getWellBeingDefinitions(categoryName);
        const label = definitions[0]?.category ?? categoryName;
        setDefinitionsByCategory((prev) => ({
          ...prev,
          [key]: {
            label,
            definitions,
          },
        }));
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Unable to load definitions for the category.'));
      } finally {
        setLoadingDefinitions(false);
      }
    },
    [loadingDefinitions]
  );

  useEffect(() => {
    const defaultCategories = ['observation', 'symptom'];
    const loadDefaults = async () => {
      for (const defaultCategory of defaultCategories) {
        const key = normaliseKey(defaultCategory);
        if (!definitionsByCategory[key]) {
          await fetchDefinitions(defaultCategory);
        }
      }
    };
    void loadDefaults();
  }, [definitionsByCategory, fetchDefinitions]);

  useEffect(() => {
    if (!definitionsByCategory[categoryKey]) {
      void fetchDefinitions(category);
    }
  }, [category, categoryKey, definitionsByCategory, fetchDefinitions]);

  useEffect(() => {
    setSelectedValues((prev) => {
      if (!availableValues.length) {
        return allowMultiple ? prev : prev.slice(0, 1);
      }
      const allowed = new Set(availableValues.map((value) => value.value));
      const filtered = prev.filter((value) => allowed.has(value));
      if (!allowMultiple && filtered.length > 1) {
        return filtered.slice(0, 1);
      }
      return filtered;
    });
  }, [availableValues, allowMultiple]);

  useEffect(() => {
    setSelectedValues([]);
  }, [type]);

  const toggleValue = (value: string) => {
    if (allowMultiple) {
      setSelectedValues((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    } else {
      setSelectedValues([value]);
    }
  };

  const handleAddCustomValue = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    setSelectedValues((prev) => {
      if (allowMultiple) {
        return Array.from(new Set([...prev, trimmed]));
      }
      return [trimmed];
    });
    setCustomValue('');
  };

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    const trimmedCategory = category.trim();
    const trimmedType = type.trim();

    if (!trimmedCategory) {
      setError('Category is required.');
      return;
    }
    if (!trimmedType) {
      setError('Type is required.');
      return;
    }
    if (selectedValues.length === 0) {
      setError('Select or add at least one value for the entry.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addWellBeingData({
        date,
        category: trimmedCategory,
        type: trimmedType,
        values: selectedValues,
      });
      setStatus('Entry saved successfully.');
      setSelectedValues([]);
      setCustomValue('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save the entry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="data-entry">
      <div className="data-entry__header">
        <div>
          <h2>Record well-being data</h2>
          <p className="data-entry__subtitle">
            Choose a category, pick an existing type, and capture the values observed.
          </p>
        </div>
        <button
          type="button"
          className="data-entry__refresh"
          onClick={() => void fetchDefinitions(category)}
          disabled={loadingDefinitions}
        >
          Refresh definitions
        </button>
      </div>

      {status && <div className="data-entry__success">{status}</div>}
      {error && <div className="data-entry__error">{error}</div>}

      <div className="data-entry__grid">
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Category
          <input
            list="data-entry-category-options"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="e.g. observation"
          />
          <datalist id="data-entry-category-options">
            {knownCategories.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label>
          Type
          <input
            list="data-entry-type-options"
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="Select or type a type"
          />
          <datalist id="data-entry-type-options">
            {typeOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="data-entry__values">
        <div className="data-entry__values-header">
          <h3>Values</h3>
          {selectedDefinition && (
            <span>
              {allowMultiple
                ? 'Multiple selections allowed'
                : 'Select a single value'}
            </span>
          )}
        </div>
        {availableValues.length > 0 ? (
          <div className="data-entry__chips">
            {availableValues.map((value) => (
              <button
                type="button"
                key={value.value}
                className={`data-entry__chip ${selectedValues.includes(value.value) ? 'data-entry__chip--active' : ''}`}
                onClick={() => toggleValue(value.value)}
              >
                {value.value}
                {value.noticeable && <span className="data-entry__chip-badge">notable</span>}
              </button>
            ))}
          </div>
        ) : (
          <p className="data-entry__hint">
            No predefined values for this type yet. Use the field below to add one.
          </p>
        )}
        <div className="data-entry__custom-value">
          <input
            type="text"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            placeholder="Add a custom value"
          />
          <button type="button" onClick={handleAddCustomValue}>
            Add value
          </button>
        </div>
      </div>

      <div className="data-entry__actions">
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          Save entry
        </button>
      </div>
    </div>
  );
};

export default WellBeingDataEntry;
