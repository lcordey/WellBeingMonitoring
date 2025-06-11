import { WellBeingForm } from './components/WellBeingForm'
import { ApiService } from './services/ApiService'
import { ObservationType, SymptomType } from './types/enums'
import './App.css'
import { useState, useEffect } from 'react'
import { WellBeingCalendar } from './components/WellBeingCalendar'
import { getData, getAllData } from './api'

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
  const [mode, setMode] = useState<'observation' | 'symptom' | 'calendar'>('observation')
  const [calendarObservationType, setCalendarObservationType] = useState<ObservationType | ''>('')
  const [calendarObservationTypes, setCalendarObservationTypes] = useState<ObservationType[]>([])
  const [calendarSymptomTypes, setCalendarSymptomTypes] = useState<SymptomType[]>([])
  const [highlightedDates, setHighlightedDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [dateColorMap, setDateColorMap] = useState<Record<string, 'observation' | 'symptom' | 'both'>>({})

  // Calendar month/year state for filtering
  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()) // 0-based

  // Fetch all data for calendar view using new backend endpoint
  useEffect(() => {
    if (mode !== 'calendar') return
    // Calculate start and end date for the current calendar month
    const startDate = new Date(calendarYear, calendarMonth, 1)
    const endDate = new Date(calendarYear, calendarMonth + 1, 0)
    const startDateStr = startDate.toISOString().slice(0, 10)
    const endDateStr = endDate.toISOString().slice(0, 10)
    getAllData({
      startDate: startDateStr,
      endDate: endDateStr,
      observationType: calendarObservationTypes,
      symptomType: calendarSymptomTypes
    }).then((data) => {
      // Build a map: date -> type(s)
      const map: Record<string, 'observation' | 'symptom' | 'both'> = {}
      for (const d of data) {
        if (d.dataType === 'observation') {
          map[d.date] = map[d.date] === 'symptom' ? 'both' : 'observation'
        } else if (d.dataType === 'symptom') {
          map[d.date] = map[d.date] === 'observation' ? 'both' : 'symptom'
        }
      }
      setDateColorMap(map)
      setHighlightedDates(Object.keys(map))
    })
  }, [mode, calendarObservationTypes, calendarSymptomTypes, calendarYear, calendarMonth])

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
        <button
          onClick={() => setMode('calendar')}
          style={{ marginLeft: 8, fontWeight: mode === 'calendar' ? 'bold' : 'normal' }}
        >
          Calendar
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
      ) : mode === 'symptom' ? (
        <WellBeingForm
          label="Symptom"
          typeOptions={getEnumOptions(SymptomType)}
          apiService={symptomApi}
          initialType={SymptomType.Headache}
          buildData={buildSymptomData}
          buildQuery={buildSymptomQuery}
        />
      ) : (
        <WellBeingCalendar
          highlightedDates={highlightedDates}
          dateColorMap={dateColorMap}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          observationTypes={calendarObservationTypes}
          symptomTypes={calendarSymptomTypes}
          onObservationTypesChange={setCalendarObservationTypes}
          onSymptomTypesChange={setCalendarSymptomTypes}
          // Pass month/year state and setters to calendar for navigation
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          setCalendarYear={setCalendarYear}
          setCalendarMonth={setCalendarMonth}
        />
      )}
    </div>
  )
}

export default App
