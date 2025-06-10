import { WellBeingForm } from './components/WellBeingForm'
import { ApiService } from './services/ApiService'
import { ObservationType, SymptomType } from './types/enums'
import './App.css'
import { useState } from 'react'

// Observation API service instance
const observationApi = new ApiService<any, any>(
  'http://localhost:5000/command',
  'http://localhost:5000/command/get'
)
// Symptom API service instance
const symptomApi = new ApiService<any, any>(
  'http://localhost:5000/command',
  'http://localhost:5000/command/get'
)

// Helper to get enum options as { key: value }
function getEnumOptions<T extends object>(e: T): Record<string, string> {
  // Only include string values (filter out numeric keys from transpiled enums)
  return Object.values(e)
    .filter((val) => typeof val === 'string')
    .reduce((acc, val) => {
      acc[val as string] = val as string
      return acc
    }, {} as Record<string, string>)
}

function buildObservationData(date: string, value: string, type: ObservationType) {
  return {
    dataType: 'observation',
    observationType: type,
    date,
    value: value ? Number(value) : null
  }
}

function buildObservationQuery(date: string, type: ObservationType) {
  return {
    dataType: 'observation',
    observationType: type,
    date
  }
}

function buildSymptomData(date: string, value: string, type: SymptomType) {
  return {
    dataType: 'symptom',
    symptomType: type,
    date,
    value: value ? Number(value) : null
  }
}

function buildSymptomQuery(date: string, type: SymptomType) {
  return {
    dataType: 'symptom',
    symptomType: type,
    date
  }
}

function App() {
  const [mode, setMode] = useState<'observation' | 'symptom'>('observation')

  return (
    <div className="App">
      <h1>Well-Being Data</h1>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setMode('observation')}
          style={{ fontWeight: mode === 'observation' ? 'bold' : 'normal' }}
        >
          Observation
        </button>
        <button
          onClick={() => setMode('symptom')}
          style={{ marginLeft: 8, fontWeight: mode === 'symptom' ? 'bold' : 'normal' }}
        >
          Symptom
        </button>
      </div>
      {mode === 'observation' ? (
        <WellBeingForm
          label="Observation"
          typeOptions={getEnumOptions(ObservationType)}
          apiService={observationApi}
          initialType={ObservationType.Food}
          buildData={buildObservationData}
          buildQuery={buildObservationQuery}
        />
      ) : (
        <WellBeingForm
          label="Symptom"
          typeOptions={getEnumOptions(SymptomType)}
          apiService={symptomApi}
          initialType={SymptomType.Headache}
          buildData={buildSymptomData}
          buildQuery={buildSymptomQuery}
        />
      )}
    </div>
  )
}

export default App
