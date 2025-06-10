import { ObservationType, SymptomType } from './types/enums';

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
  const response = await fetch('http://localhost:5000/command/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  if (!response.ok) throw new Error('Failed to get data');
  return response.json();
}
