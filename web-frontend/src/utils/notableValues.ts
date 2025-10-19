import type { WellBeingDefinition, WellBeingEntry } from '../api';

export type NotableValuesMap = Record<string, Set<string>>;

export const normaliseCategoryKey = (value: string) => value.trim().toLowerCase();
export const normaliseTypeKey = (value: string) => value.trim().toLowerCase();
export const normaliseValueKey = (value: string) => value.trim().toLowerCase();

export const getEntryKey = (category: string, type: string) =>
  `${normaliseCategoryKey(category)}|${normaliseTypeKey(type)}`;

export interface DefinitionsByCategory {
  category: string;
  definitions: WellBeingDefinition[];
}

export const buildNotableValuesMap = (
  input: DefinitionsByCategory[]
): NotableValuesMap => {
  const map: NotableValuesMap = {};

  input.forEach(({ category, definitions }) => {
    const categoryKey = normaliseCategoryKey(category);
    definitions.forEach((definition) => {
      const key = getEntryKey(categoryKey, definition.type);
      const set = new Set<string>();
      (definition.values ?? []).forEach((value) => {
        if (value.noticeable) {
          set.add(normaliseValueKey(value.value));
        }
      });
      if (set.size > 0) {
        map[key] = set;
      }
    });
  });

  return map;
};

export const isValueNotable = (
  map: NotableValuesMap,
  category: string,
  type: string,
  value: string
) => {
  const key = getEntryKey(category, type);
  const notableValues = map[key];
  if (!notableValues) return false;
  return notableValues.has(normaliseValueKey(value));
};

export const hasNotableValue = (map: NotableValuesMap, entry: WellBeingEntry) =>
  entry.values.some((value) => isValueNotable(map, entry.category, entry.type, value));

export const splitValuesByNotable = (map: NotableValuesMap, entry: WellBeingEntry) => {
  const notableValues: string[] = [];
  const otherValues: string[] = [];

  if (entry.values.length === 0) {
    return { notableValues, otherValues };
  }

  entry.values.forEach((value) => {
    if (isValueNotable(map, entry.category, entry.type, value)) {
      notableValues.push(value);
    } else {
      otherValues.push(value);
    }
  });

  return { notableValues, otherValues };
};
