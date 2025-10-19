import { getWellBeingDefinitions, type WellBeingDefinition, type WellBeingEntry } from '../api';

export type NotableValueLookup = Record<string, Record<string, Set<string>>>;

export const normaliseCategoryKey = (value: string) => value.trim().toLowerCase();
export const normaliseTypeKey = (value: string) => value.trim().toLowerCase();
export const normaliseValueKey = (value: string) => value.trim().toLowerCase();

const buildTypeNotableMap = (
  definitions: WellBeingDefinition[]
): Record<string, Set<string>> => {
  const map: Record<string, Set<string>> = {};

  definitions.forEach((definition) => {
    const typeKey = normaliseTypeKey(definition.type);
    if (!map[typeKey]) {
      map[typeKey] = new Set<string>();
    }

    definition.values.forEach((value) => {
      if (value.noticeable) {
        map[typeKey].add(normaliseValueKey(value.value));
      }
    });

    if (map[typeKey].size === 0) {
      delete map[typeKey];
    }
  });

  return map;
};

export async function fetchNotableLookup(
  entries: WellBeingEntry[]
): Promise<NotableValueLookup> {
  const categoryMap = new Map<string, string>();
  entries.forEach((entry) => {
    const categoryKey = normaliseCategoryKey(entry.category);
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, entry.category);
    }
  });

  const lookup: NotableValueLookup = {};

  await Promise.all(
    Array.from(categoryMap.entries()).map(async ([categoryKey, originalCategory]) => {
      try {
        const definitions = await getWellBeingDefinitions(originalCategory);
        lookup[categoryKey] = buildTypeNotableMap(definitions);
      } catch (error) {
        console.error('Unable to fetch definitions for category', originalCategory, error);
        lookup[categoryKey] = {};
      }
    })
  );

  return lookup;
}

export interface EntryValueSplit {
  notableValues: string[];
  regularValues: string[];
}

export function splitEntryValues(
  entry: WellBeingEntry,
  lookup: NotableValueLookup
): EntryValueSplit {
  const categoryKey = normaliseCategoryKey(entry.category);
  const typeKey = normaliseTypeKey(entry.type);
  const notableSet = lookup[categoryKey]?.[typeKey];

  if (!Array.isArray(entry.values) || entry.values.length === 0 || !notableSet) {
    return { notableValues: [], regularValues: entry.values ?? [] };
  }

  const notableValues: string[] = [];
  const regularValues: string[] = [];

  entry.values.forEach((value) => {
    if (notableSet.has(normaliseValueKey(value))) {
      notableValues.push(value);
    } else {
      regularValues.push(value);
    }
  });

  return { notableValues, regularValues };
}

export function hasNotableValue(
  entry: WellBeingEntry,
  lookup: NotableValueLookup
): boolean {
  const { notableValues } = splitEntryValues(entry, lookup);
  return notableValues.length > 0;
}
