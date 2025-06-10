import type { ObservationType, SymptomType } from './types/enums';

// Utility functions to interact with the backend REST API
export interface WellBeingData {
  date: string;
  value: any;
  dataType: string;
}

export interface Observation extends WellBeingData {
  dataType: 'observation';
  observationType: ObservationType;
}

export interface Symptom extends WellBeingData {
  dataType: 'symptom';
  symptomType: SymptomType;
}

export async function setData(data: Observation | Symptom) {
  const response = await fetch('http://localhost:5000/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!response.ok) throw new Error('Failed to set data');
}

export async function getData(query: Partial<Observation> | Partial<Symptom>) {
  console.log('getData query:', query); // Debug log
  const response = await fetch('http://localhost:5000/command/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('Backend error response:', text); // Debug log
    throw new Error('Failed to get data');
  }
  return response.json();
}

export async function getAllData(params: {
  startDate?: string;
  endDate?: string;
  observationType?: string;
  symptomType?: string;
}): Promise<WellBeingData[]> {
  const response = await fetch('http://localhost:5000/command/get-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      StartDate: params.startDate ?? null,
      EndDate: params.endDate ?? null,
      ObservationType: params.observationType ?? null,
      SymptomType: params.symptomType ?? null,
    })
  });
  if (!response.ok) throw new Error('Failed to get all data');
  return response.json();
}
