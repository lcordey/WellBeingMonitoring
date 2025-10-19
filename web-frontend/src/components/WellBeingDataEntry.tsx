import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addWellBeingData,
  getWellBeingCategoryTypes,
  getWellBeingDefinitions,
  type WellBeingCategoryTypes,
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

interface CatalogueEntry {
  label: string;
  types: string[];
}

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
  const [catalogue, setCatalogue] = useState<Record<string, CatalogueEntry>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadingCatalogueRef = useRef(false);
  const loadingDefinitionsRef = useRef(false);

  const categoryKey = normaliseKey(category);

  const categoryOptions = useMemo(() => {
    const entries = new Map<string, string>();
    entries.set(normaliseKey('observation'), 'observation');
    entries.set(normaliseKey('symptom'), 'symptom');
    Object.values(definitionsByCategory).forEach((item) => {
      entries.set(normaliseKey(item.label), item.label);
    });
    Object.values(catalogue).forEach((item) => {
      entries.set(normaliseKey(item.label), item.label);
    });
    return Array.from(entries.values()).sort((a, b) => a.localeCompare(b));
  }, [catalogue, definitionsByCategory]);

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
    () => {
      const catalogueTypes = catalogue[categoryKey]?.types ?? [];
      const definitionTypes = definitionsForCategory.map((definition) => definition.type);
      return Array.from(
        new Set(
          [...catalogueTypes, ...definitionTypes]
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));
    },
    [catalogue, categoryKey, definitionsForCategory]
  );

  const refreshCatalogue = useCallback(async () => {
    if (loadingCatalogueRef.current) {
      return;
    }
    loadingCatalogueRef.current = true;
    setLoadingCatalogue(true);
    setError(null);
    try {
      const entries = await getWellBeingCategoryTypes();
      setCatalogue(() => {
        const map: Record<string, CatalogueEntry> = {};
        entries.forEach((entry: WellBeingCategoryTypes) => {
          const label = entry.category?.trim();
          if (!label) return;
          const key = normaliseKey(label);
          const types = Array.from(
            new Set(
              (entry.types ?? [])
                .map((type) => type.trim())
                .filter((value) => value.length > 0)
            )
          ).sort((a, b) => a.localeCompare(b));
          map[key] = {
            label,
            types,
          };
        });
        return map;
      });
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Unable to load the list of categories and types from the server.'
        )
      );
    } finally {
      loadingCatalogueRef.current = false;
      setLoadingCatalogue(false);
    }
  }, []);

  const fetchDefinitions = useCallback(
    async (categoryName: string) => {
      const trimmedCategory = categoryName.trim();
      if (!trimmedCategory) {
        return;
      }
      const key = normaliseKey(trimmedCategory);
      if (loadingDefinitionsRef.current) return;
      setLoadingDefinitions(true);
      setError(null);
      loadingDefinitionsRef.current = true;
      try {
        const definitions = await getWellBeingDefinitions(trimmedCategory);
        const label = definitions[0]?.category ?? trimmedCategory;
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
        loadingDefinitionsRef.current = false;
        setLoadingDefinitions(false);
      }
    },
    []
  );

  useEffect(() => {
    void refreshCatalogue();
  }, [refreshCatalogue]);

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
    if (categoryOptions.length === 0) {
      return;
    }
    const normalisedOptions = new Set(categoryOptions.map(normaliseKey));
    if (!normalisedOptions.has(categoryKey)) {
      setCategory(categoryOptions[0]);
    }
  }, [categoryKey, categoryOptions]);

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

  useEffect(() => {
    if (!type) {
      if (typeOptions.length === 1) {
        setType(typeOptions[0]);
      }
      return;
    }
    const normalisedOptions = new Set(typeOptions.map(normaliseKey));
    if (!normalisedOptions.has(normaliseKey(type))) {
      setType('');
    }
  }, [typeOptions, type]);

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
          onClick={() => {
            void refreshCatalogue();
            void fetchDefinitions(category);
          }}
          disabled={loadingDefinitions || loadingCatalogue}
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
          <select
            value={categoryOptions.length ? category : ''}
            onChange={(event) => setCategory(event.target.value)}
            disabled={categoryOptions.length === 0}
          >
            {categoryOptions.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              <>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </>
            )}
          </select>
        </label>
        <label>
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            disabled={typeOptions.length === 0}
          >
            <option value="">
              {typeOptions.length === 0 ? 'No types available' : 'Select a type'}
            </option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
