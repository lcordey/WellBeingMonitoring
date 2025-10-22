const BASE_URL = 'http://192.168.178.22:5000/command';

const normaliseDate = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? '');
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

export interface WellBeingEntry {
  date: string;
  category: string;
  type: string;
  values: string[];
}

export interface WellBeingDefinitionValue {
  value: string;
  noticeable: boolean;
}

export interface WellBeingDefinition {
  category: string;
  type: string;
  allowMultiple: boolean;
  values: WellBeingDefinitionValue[];
}

export interface WellBeingCategoryTypes {
  category: string;
  types: string[];
}

type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' ? (value as AnyRecord) : {};

const pickFirst = (source: AnyRecord, ...keys: string[]) => {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
};

const normaliseEntry = (raw: unknown): WellBeingEntry => {
  const record = asRecord(raw);
  const date = normaliseDate(pickFirst(record, 'Date', 'date'));
  const category = String(pickFirst(record, 'Category', 'category') ?? '').trim();
  const type = String(pickFirst(record, 'Type', 'type') ?? '').trim();
  const rawValues = pickFirst(record, 'Values', 'values');
  const arrayValues = Array.isArray(rawValues)
    ? rawValues
    : rawValues === undefined || rawValues === null
      ? []
      : [rawValues];
  const values = arrayValues.map((value) => String(value));

  return {
    date,
    category,
    type,
    values,
  };
};

const normaliseValue = (raw: unknown): WellBeingDefinitionValue => {
  const record = asRecord(raw);
  const arrayValue = Array.isArray(raw) ? raw : [];
  const valueCandidate =
    pickFirst(record, 'Value', 'value', 'Item1', 'item1') ?? arrayValue[0] ?? '';
  const noticeableCandidate =
    pickFirst(record, 'Noticeable', 'noticeable', 'Item2', 'item2') ??
    arrayValue[1] ??
    false;

  return {
    value: String(valueCandidate ?? ''),
    noticeable: toBoolean(noticeableCandidate),
  };
};

const normaliseDefinition = (raw: unknown): WellBeingDefinition => {
  const record = asRecord(raw);
  const valuesContainer = asRecord(pickFirst(record, 'Values', 'values'));
  const rawValues = pickFirst(valuesContainer, 'Values', 'values');

  const values = Array.isArray(rawValues)
    ? rawValues.map(normaliseValue)
    : [];

  return {
    category: String(pickFirst(record, 'Category', 'category') ?? '').trim(),
    type: String(pickFirst(record, 'Type', 'type') ?? '').trim(),
    allowMultiple: toBoolean(
      pickFirst(
        record,
        'AllowMultiple',
        'allowMultiple',
        'AllowMultipleSelection',
        'allowMultipleSelection'
      ) ?? false
    ),
    values,
  };
};

const normaliseCategoryTypes = (raw: unknown): WellBeingCategoryTypes => {
  const record = asRecord(raw);
  const rawTypes = pickFirst(record, 'Types', 'types', 'Type', 'type');
  const typesArray = Array.isArray(rawTypes)
    ? rawTypes
    : rawTypes === undefined || rawTypes === null
      ? []
      : [rawTypes];
  const types = Array.from(
    new Set(
      typesArray
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  return {
    category: String(pickFirst(record, 'Category', 'category') ?? '').trim(),
    types,
  };
};

export async function addWellBeingData(entry: {
  date: string;
  category: string;
  type: string;
  values: string[];
}) {
  await postJson<void>('/addWBData', {
    Data: {
      Date: entry.date,
      Category: entry.category,
      Type: entry.type,
      Values: entry.values,
    },
  });
}

export async function deleteWellBeingData(entry: {
  date: string;
  category: string;
  type: string;
}) {
  await postJson<void>('/deleteWBData', {
    Date: entry.date,
    Category: entry.category,
    Type: entry.type,
  });
}

export interface GetAllWellBeingDataParams {
  startDate?: string;
  endDate?: string;
  categoryAndTypes?: { category: string; type: string }[];
}

export async function getAllWellBeingData(
  params: GetAllWellBeingDataParams = {}
): Promise<WellBeingEntry[]> {
  const response = await postJson<unknown[]>('/getAll', {
    StartDate: params.startDate ?? null,
    EndDate: params.endDate ?? null,
    CategoryAndTypes: params.categoryAndTypes?.map((item) => ({
      Category: item.category,
      Type: item.type,
    })) ?? [],
  });

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(normaliseEntry);
}

export async function createWellBeingType(payload: {
  category: string;
  type: string;
  allowMultipleSelection: boolean;
}) {
  await postJson<void>('/createWBType', {
    Category: payload.category,
    Type: payload.type,
    AllowMultipleSelection: payload.allowMultipleSelection,
  });
}

export async function deleteWellBeingType(payload: { category: string; type: string }) {
  await postJson<void>('/deleteWBType', {
    CategoryAndType: {
      Category: payload.category,
      Type: payload.type,
    },
  });
}

export async function addWellBeingValue(payload: { type: string; value: string; notable: boolean }) {
  await postJson<void>('/addWBValue', {
    Type: payload.type,
    Value: payload.value,
    Notable: payload.notable,
  });
}

export async function deleteWellBeingValue(payload: { type: string; value: string }) {
  await postJson<void>('/deleteWBValue', {
    Type: payload.type,
    Value: payload.value,
  });
}

export async function getWellBeingDefinitions(
  category: string
): Promise<WellBeingDefinition[]> {
  const response = await postJson<unknown[]>('/getWBDefinitions', {
    Category: category,
  });

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(normaliseDefinition);
}

export async function getWellBeingValues(
  type: string
): Promise<WellBeingDefinitionValue[]> {
  const response = await postJson<unknown>('/getWBValues', {
    Type: type,
  });

  const valuesRecord = asRecord(response);
  const rawValues = pickFirst(valuesRecord, 'Values', 'values');
  if (!Array.isArray(rawValues)) return [];
  return rawValues.map(normaliseValue);
}

export async function getWellBeingCategoryTypes(): Promise<WellBeingCategoryTypes[]> {
  const response = await getJson<unknown[]>('/catalogue');

  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .map(normaliseCategoryTypes)
    .filter((item) => item.category.length > 0);
}

