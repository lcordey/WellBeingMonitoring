import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addWellBeingValue,
  createWellBeingType,
  deleteWellBeingType,
  deleteWellBeingValue,
  getWellBeingDefinitions,
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
  const [valueCategory, setValueCategory] = useState('observation');
  const [valueTypeName, setValueTypeName] = useState('');
  const [valueName, setValueName] = useState('');
  const [valueNotable, setValueNotable] = useState(false);
  const [removeValueName, setRemoveValueName] = useState('');

  useEffect(() => {
    if (!FIXED_CATEGORIES.includes(newTypeCategory)) {
      setNewTypeCategory(FIXED_CATEGORIES[0]);
    }
  }, [newTypeCategory]);

  const deleteTypeOptions = useMemo(() => {
    const key = normaliseKey(deleteTypeCategory);
    return definitionsByCategory[key]?.definitions ?? [];
  }, [definitionsByCategory, deleteTypeCategory]);

  const valueCategoryDefinitions = useMemo(() => {
    const key = normaliseKey(valueCategory);
    return definitionsByCategory[key]?.definitions ?? [];
  }, [definitionsByCategory, valueCategory]);

  useEffect(() => {
    if (!valueTypeName) {
      return;
    }
    const exists = valueCategoryDefinitions.some(
      (definition) => definition.type.trim().toLowerCase() === valueTypeName.trim().toLowerCase()
    );
    if (!exists) {
      setValueTypeName('');
      setRemoveValueName('');
    }
  }, [valueCategoryDefinitions, valueTypeName]);

  const definitionsForSelectedCategory = useMemo(() => {
    const key = normaliseKey(definitionsCategory);
    return definitionsByCategory[key]?.definitions ?? [];
  }, [definitionsByCategory, definitionsCategory]);

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

  useEffect(() => {
    const trimmed = valueCategory.trim();
    if (!trimmed) {
      return;
    }
    const key = normaliseKey(trimmed);
    if (!definitionsByCategory[key]) {
      void fetchDefinitionsForCategory(trimmed);
    }
  }, [definitionsByCategory, fetchDefinitionsForCategory, valueCategory]);

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
    const category = valueCategory.trim();
    const value = valueName.trim();
    if (!type || !value || !category) return;
    setMessage(null);
    setError(null);
    try {
      await addWellBeingValue({ type, value, notable: valueNotable });
      setMessage(`Value “${value}” added to ${type}.`);
      setValueName('');
      setValueNotable(false);
      await fetchDefinitionsForCategory(category);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to add the value.'));
    }
  };

  const handleRemoveValue = async () => {
    const type = valueTypeName.trim();
    const category = valueCategory.trim();
    const value = removeValueName.trim();
    if (!type || !value || !category) return;
    setMessage(null);
    setError(null);
    try {
      await deleteWellBeingValue({ type, value });
      setMessage(`Value “${value}” removed from ${type}.`);
      setRemoveValueName('');
      await fetchDefinitionsForCategory(category);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to remove the value.'));
    }
  };

  const availableValuesForType = useMemo(() => {
    if (!valueTypeName.trim()) {
      return [] as WellBeingDefinitionValue[];
    }
    const lower = valueTypeName.trim().toLowerCase();
    const definition = valueCategoryDefinitions.find(
      (item) => item.type.trim().toLowerCase() === lower
    );
    return definition?.values ?? [];
  }, [valueCategoryDefinitions, valueTypeName]);

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
          <div className="definitions-manager__field">
            <span className="definitions-manager__field-label">Category</span>
            <div
              className="definitions-manager__toggle-group"
              role="group"
              aria-label="Browse definitions category"
            >
              {FIXED_CATEGORIES.map((option) => {
                const isActive = definitionsCategory === option;
                return (
                  <button
                    type="button"
                    key={option}
                    className={`definitions-manager__toggle ${
                      isActive ? 'definitions-manager__toggle--active' : ''
                    }`}
                    onClick={() => setDefinitionsCategory(option)}
                    aria-pressed={isActive}
                  >
                    {formatLabel(option)}
                  </button>
                );
              })}
            </div>
          </div>
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
                    <li className="definitions-manager__value-empty">No values defined yet.</li>
                  ) : (
                    definition.values.map((value) => (
                      <li key={value.value}>
                        <span
                          className={`definitions-manager__value-pill${value.noticeable ? ' definitions-manager__value-pill--notable' : ''}`}
                        >
                          {value.value}
                        </span>
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
          <div className="definitions-manager__field">
            <span className="definitions-manager__field-label">Category</span>
            <div
              className="definitions-manager__toggle-group"
              role="group"
              aria-label="Category for new type"
            >
              {FIXED_CATEGORIES.map((option) => {
                const isActive = newTypeCategory === option;
                return (
                  <button
                    type="button"
                    key={option}
                    className={`definitions-manager__toggle ${
                      isActive ? 'definitions-manager__toggle--active' : ''
                    }`}
                    onClick={() => setNewTypeCategory(option)}
                    aria-pressed={isActive}
                  >
                    {formatLabel(option)}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="definitions-manager__field">
            <span className="definitions-manager__field-label">Type name</span>
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
          <div className="definitions-manager__field">
            <span className="definitions-manager__field-label">Category</span>
            <div
              className="definitions-manager__toggle-group"
              role="group"
              aria-label="Category for deleting a type"
            >
              {FIXED_CATEGORIES.map((option) => {
                const isActive = deleteTypeCategory === option;
                return (
                  <button
                    type="button"
                    key={option}
                    className={`definitions-manager__toggle ${
                      isActive ? 'definitions-manager__toggle--active' : ''
                    }`}
                    onClick={() => {
                      if (deleteTypeCategory === option) {
                        return;
                      }
                      setDeleteTypeCategory(option);
                      setDeleteTypeName('');
                    }}
                    aria-pressed={isActive}
                  >
                    {formatLabel(option)}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="definitions-manager__field">
            <span className="definitions-manager__field-label">Type name</span>
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
        <div className="definitions-manager__form-grid definitions-manager__form-grid--values">
          <div className="definitions-manager__form-row definitions-manager__form-row--two">
            <div className="definitions-manager__field">
              <span className="definitions-manager__field-label">Category</span>
              <div
                className="definitions-manager__toggle-group"
                role="group"
                aria-label="Category for values"
              >
                {FIXED_CATEGORIES.map((option) => {
                  const isActive = valueCategory === option;
                  return (
                    <button
                      type="button"
                      key={option}
                      className={`definitions-manager__toggle ${
                        isActive ? 'definitions-manager__toggle--active' : ''
                      }`}
                      onClick={() => {
                        if (valueCategory === option) {
                          return;
                        }
                        setValueCategory(option);
                        setValueTypeName('');
                        setRemoveValueName('');
                      }}
                      aria-pressed={isActive}
                    >
                      {formatLabel(option)}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="definitions-manager__field">
              <span className="definitions-manager__field-label">Type</span>
              <select
                value={valueTypeName}
                onChange={(event) => {
                  setValueTypeName(event.target.value);
                  setRemoveValueName('');
                }}
              >
                <option value="">Select a type</option>
                {valueCategoryDefinitions.map((definition) => (
                  <option key={definition.type} value={definition.type}>
                    {definition.type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="definitions-manager__form-row definitions-manager__form-row--three">
            <label className="definitions-manager__field">
              <span className="definitions-manager__field-label">New value</span>
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
            <button
              type="button"
              onClick={handleAddValue}
              disabled={!valueCategory.trim() || !valueTypeName.trim() || !valueName.trim()}
            >
              Add value
            </button>
          </div>

          <div className="definitions-manager__form-row definitions-manager__form-row--two">
            <label className="definitions-manager__field">
              <span className="definitions-manager__field-label">Remove value</span>
              <select value={removeValueName} onChange={(event) => setRemoveValueName(event.target.value)}>
                <option value="">Select a value</option>
                {availableValuesForType.map((value) => (
                  <option key={value.value} value={value.value}>
                    {value.value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleRemoveValue}
              disabled={!valueCategory.trim() || !valueTypeName.trim() || !removeValueName.trim()}
            >
              Delete value
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default WellBeingAdminPage;
