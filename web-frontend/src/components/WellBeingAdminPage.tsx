import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addWellBeingValue,
  createWellBeingType,
  deleteWellBeingType,
  deleteWellBeingValue,
  getWellBeingDefinitions,
  getWellBeingValues,
  type WellBeingDefinition,
  type WellBeingDefinitionValue,
} from '../api';

const normaliseKey = (value: string) => value.trim().toLowerCase();

interface CategoryDefinitions {
  label: string;
  definitions: WellBeingDefinition[];
}

type CategoryDictionary = Record<string, CategoryDefinitions>;

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const FIXED_CATEGORIES: string[] = ['observation', 'symptom'];

export const WellBeingAdminPage: React.FC = () => {
  const [definitionsByCategory, setDefinitionsByCategory] = useState<CategoryDictionary>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategoryKey, setLoadingCategoryKey] = useState<string | null>(null);

  const [definitionsCategory, setDefinitionsCategory] = useState('observation');
  const [newTypeCategory, setNewTypeCategory] = useState('observation');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeAllowMultiple, setNewTypeAllowMultiple] = useState(false);
  const [deleteTypeCategory, setDeleteTypeCategory] = useState('observation');
  const [deleteTypeName, setDeleteTypeName] = useState('');
  const [valueTypeName, setValueTypeName] = useState('');
  const [valueName, setValueName] = useState('');
  const [valueNotable, setValueNotable] = useState(false);
  const [removeValueName, setRemoveValueName] = useState('');
  const [lookupType, setLookupType] = useState('');
  const [lookupValues, setLookupValues] = useState<WellBeingDefinitionValue[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const knownCategories = useMemo(() => {
    const map = new Map<string, string>();
    FIXED_CATEGORIES.forEach((category) => {
      map.set(normaliseKey(category), category);
    });
    Object.values(definitionsByCategory).forEach((entry) => {
      map.set(normaliseKey(entry.label), entry.label);
    });
    return Array.from(new Set(map.values())).sort();
  }, [definitionsByCategory]);

  useEffect(() => {
    if (!FIXED_CATEGORIES.includes(newTypeCategory)) {
      setNewTypeCategory(FIXED_CATEGORIES[0]);
    }
  }, [newTypeCategory]);

  const allTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(definitionsByCategory).forEach((category) => {
      category.definitions.forEach((definition) => {
        if (!map.has(definition.type)) {
          map.set(
            definition.type,
            `${definition.type} (${formatLabel(category.label)})`
          );
        }
      });
    });
    return Array.from(map.entries())
      .map(([type, label]) => ({ type, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [definitionsByCategory]);

  const deleteTypeOptions = useMemo(() => {
    const key = normaliseKey(deleteTypeCategory);
    return definitionsByCategory[key]?.definitions ?? [];
  }, [definitionsByCategory, deleteTypeCategory]);

  const definitionsForSelectedCategory = useMemo(() => {
    const key = normaliseKey(definitionsCategory);
    return definitionsByCategory[key]?.definitions ?? [];
  }, [definitionsByCategory, definitionsCategory]);

  const findCategoryByType = (type: string) => {
    const needle = type.trim().toLowerCase();
    for (const [key, entry] of Object.entries(definitionsByCategory)) {
      const match = entry.definitions.find(
        (definition) => definition.type.trim().toLowerCase() === needle
      );
      if (match) {
        return { key, label: entry.label };
      }
    }
    return null;
  };

  const fetchDefinitionsForCategory = useCallback(
    async (category: string) => {
      const trimmed = category.trim();
      if (!trimmed) return;
      const key = normaliseKey(trimmed);
      setLoadingCategoryKey(key);
      try {
        const definitions = await getWellBeingDefinitions(trimmed);
        const label = definitions[0]?.category ?? trimmed;
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
        setLoadingCategoryKey(null);
      }
    },
    []
  );

  useEffect(() => {
    const loadDefaults = async () => {
      for (const category of ['observation', 'symptom']) {
        const key = normaliseKey(category);
        if (!definitionsByCategory[key]) {
          await fetchDefinitionsForCategory(category);
        }
      }
    };
    void loadDefaults();
  }, [definitionsByCategory, fetchDefinitionsForCategory]);

  const handleFetchDefinitions = async () => {
    setMessage(null);
    setError(null);
    await fetchDefinitionsForCategory(definitionsCategory);
  };

  const handleCreateType = async () => {
    const category = newTypeCategory.trim();
    const type = newTypeName.trim();
    if (!category || !type) return;
    if (!FIXED_CATEGORIES.includes(category)) {
      setMessage(null);
      setError('The selected category is not supported.');
      return;
    }
    setMessage(null);
    setError(null);
    try {
      await createWellBeingType({
        category,
        type,
        allowMultipleSelection: newTypeAllowMultiple,
      });
      setMessage(`Type “${type}” created in ${formatLabel(category)}.`);
      setNewTypeName('');
      setNewTypeAllowMultiple(false);
      await fetchDefinitionsForCategory(category);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to create the type.'));
    }
  };

  const handleDeleteType = async () => {
    const category = deleteTypeCategory.trim();
    const type = deleteTypeName.trim();
    if (!category || !type) return;
    setMessage(null);
    setError(null);
    try {
      await deleteWellBeingType({ category, type });
      setMessage(`Type “${type}” removed from ${formatLabel(category)}.`);
      setDeleteTypeName('');
      await fetchDefinitionsForCategory(category);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to delete the type.'));
    }
  };

  const handleAddValue = async () => {
    const type = valueTypeName.trim();
    const value = valueName.trim();
    if (!type || !value) return;
    setMessage(null);
    setError(null);
    try {
      await addWellBeingValue({ type, value, notable: valueNotable });
      setMessage(`Value “${value}” added to ${type}.`);
      setValueName('');
      setValueNotable(false);
      const categoryInfo = findCategoryByType(type);
      if (categoryInfo) {
        await fetchDefinitionsForCategory(categoryInfo.label);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to add the value.'));
    }
  };

  const handleRemoveValue = async () => {
    const type = valueTypeName.trim();
    const value = removeValueName.trim();
    if (!type || !value) return;
    setMessage(null);
    setError(null);
    try {
      await deleteWellBeingValue({ type, value });
      setMessage(`Value “${value}” removed from ${type}.`);
      setRemoveValueName('');
      const categoryInfo = findCategoryByType(type);
      if (categoryInfo) {
        await fetchDefinitionsForCategory(categoryInfo.label);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to remove the value.'));
    }
  };

  const handleLookupValues = async () => {
    const type = lookupType.trim();
    if (!type) return;
    setLookupError(null);
    setLookupValues([]);
    setLookupLoading(true);
    try {
      const values = await getWellBeingValues(type);
      setLookupValues(values);
    } catch (err: unknown) {
      setLookupError(getErrorMessage(err, 'Unable to retrieve values for the type.'));
    } finally {
      setLookupLoading(false);
    }
  };

  const availableValuesForType = (() => {
    const info = findCategoryByType(valueTypeName);
    if (!info) return [] as WellBeingDefinitionValue[];
    const definition = definitionsByCategory[info.key]?.definitions.find(
      (item) => item.type.trim().toLowerCase() === valueTypeName.trim().toLowerCase()
    );
    return definition?.values ?? [];
  })();

  return (
    <div className="definitions-manager">
      <h2>Definition management</h2>
      <p className="definitions-manager__subtitle">
        Create new types, manage allowed values, and inspect the catalogue shared with the backend.
      </p>

      {message && <div className="definitions-manager__success">{message}</div>}
      {error && <div className="definitions-manager__error">{error}</div>}

      <section className="definitions-manager__section">
        <h3>Browse definitions</h3>
        <div className="definitions-manager__form-grid">
          <label>
            Category
            <input
              list="definitions-category-options"
              value={definitionsCategory}
              onChange={(event) => setDefinitionsCategory(event.target.value)}
              placeholder="e.g. observation"
            />
            <datalist id="definitions-category-options">
              {knownCategories.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            onClick={handleFetchDefinitions}
            disabled={loadingCategoryKey === normaliseKey(definitionsCategory)}
          >
            Load definitions
          </button>
        </div>
        {loadingCategoryKey === normaliseKey(definitionsCategory) ? (
          <p>Loading definitions…</p>
        ) : definitionsForSelectedCategory.length === 0 ? (
          <p>No definitions stored for this category yet.</p>
        ) : (
          <ul className="definitions-manager__definition-list">
            {definitionsForSelectedCategory.map((definition) => (
              <li key={definition.type}>
                <div className="definitions-manager__definition-header">
                  <strong>{definition.type}</strong>
                  <span>
                    {definition.allowMultiple
                      ? 'Multiple values allowed'
                      : 'Single value'}
                  </span>
                </div>
                <ul className="definitions-manager__value-list">
                  {definition.values.length === 0 ? (
                    <li>No values defined yet.</li>
                  ) : (
                    definition.values.map((value) => (
                      <li key={value.value}>
                        {value.value} {value.noticeable && <em>(notable)</em>}
                      </li>
                    ))
                  )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="definitions-manager__section">
        <h3>Create a type</h3>
        <div className="definitions-manager__form-grid">
          <label>
            Category
            <select value={newTypeCategory} onChange={(event) => setNewTypeCategory(event.target.value)}>
              {FIXED_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type name
            <input
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
              placeholder="Type"
            />
          </label>
          <label className="definitions-manager__checkbox">
            <input
              type="checkbox"
              checked={newTypeAllowMultiple}
              onChange={(event) => setNewTypeAllowMultiple(event.target.checked)}
            />
            Allow multiple values
          </label>
          <button type="button" onClick={handleCreateType} disabled={!newTypeCategory.trim() || !newTypeName.trim()}>
            Create type
          </button>
        </div>
      </section>

      <section className="definitions-manager__section">
        <h3>Delete a type</h3>
        <div className="definitions-manager__form-grid">
          <label>
            Category
            <input
              value={deleteTypeCategory}
              onChange={(event) => setDeleteTypeCategory(event.target.value)}
              placeholder="Category"
            />
          </label>
          <label>
            Type name
            <select value={deleteTypeName} onChange={(event) => setDeleteTypeName(event.target.value)}>
              <option value="">Select a type</option>
              {deleteTypeOptions.map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {definition.type}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleDeleteType} disabled={!deleteTypeCategory.trim() || !deleteTypeName.trim()}>
            Delete type
          </button>
        </div>
      </section>

      <section className="definitions-manager__section">
        <h3>Manage values</h3>
        <div className="definitions-manager__form-grid">
          <label>
            Type
            <input
              list="definitions-type-options"
              value={valueTypeName}
              onChange={(event) => setValueTypeName(event.target.value)}
              placeholder="Type name"
            />
            <datalist id="definitions-type-options">
              {allTypeOptions.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </datalist>
          </label>
          <label>
            New value
            <input
              value={valueName}
              onChange={(event) => setValueName(event.target.value)}
              placeholder="Value"
            />
          </label>
          <label className="definitions-manager__checkbox">
            <input
              type="checkbox"
              checked={valueNotable}
              onChange={(event) => setValueNotable(event.target.checked)}
            />
            Mark as notable
          </label>
          <button type="button" onClick={handleAddValue} disabled={!valueTypeName.trim() || !valueName.trim()}>
            Add value
          </button>
          <label>
            Remove value
            <select value={removeValueName} onChange={(event) => setRemoveValueName(event.target.value)}>
              <option value="">Select a value</option>
              {availableValuesForType.map((value) => (
                <option key={value.value} value={value.value}>
                  {value.value}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleRemoveValue} disabled={!valueTypeName.trim() || !removeValueName.trim()}>
            Delete value
          </button>
        </div>
      </section>

      <section className="definitions-manager__section">
        <h3>Lookup values for a type</h3>
        <div className="definitions-manager__form-grid">
          <label>
            Type
            <input
              list="definitions-type-options"
              value={lookupType}
              onChange={(event) => setLookupType(event.target.value)}
              placeholder="Type name"
            />
          </label>
          <button type="button" onClick={handleLookupValues} disabled={lookupLoading || !lookupType.trim()}>
            Fetch values
          </button>
        </div>
        {lookupLoading && <p>Loading values…</p>}
        {lookupError && <div className="definitions-manager__error">{lookupError}</div>}
        {!lookupLoading && lookupValues.length > 0 && (
          <ul className="definitions-manager__value-list definitions-manager__value-list--inline">
            {lookupValues.map((value) => (
              <li key={value.value}>
                {value.value} {value.noticeable && <em>(notable)</em>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default WellBeingAdminPage;
