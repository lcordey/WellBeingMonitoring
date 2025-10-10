import { WellBeingForm } from './components/WellBeingForm'
import { ApiService } from './services/ApiService'
import { ObservationType, SymptomType } from './types/enums'
import './App.css'
import { useState, useEffect, useCallback } from 'react'
import { WellBeingCalendar } from './components/WellBeingCalendar'
import { getAllData } from './api'
import { ApiTestPage } from './components/ApiTestPage'
import { WellBeingAdminPage } from './components/WellBeingAdminPage'
import { WellBeingDashboard } from './components/WellBeingDashboard'
import { WellBeingDataExplorer } from './components/WellBeingDataExplorer'
import { SelectedDateDetails } from './components/SelectedDateDetails'
import type { WellBeingEntry } from './api'

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
  const [mode, setMode] = useState<'observation' | 'symptom' | 'calendar' | 'dashboard' | 'explorer'>('observation')
  const [calendarObservationTypes, setCalendarObservationTypes] = useState<ObservationType[]>([])
  const [calendarSymptomTypes, setCalendarSymptomTypes] = useState<SymptomType[]>([])
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [dateColorMap, setDateColorMap] = useState<Record<string, 'observation' | 'symptom' | 'both'>>({})
  const [showApiTest, setShowApiTest] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [selectedDateEntries, setSelectedDateEntries] = useState<WellBeingEntry[]>([])
  const [selectedDateLoading, setSelectedDateLoading] = useState(false)
  const [selectedDateError, setSelectedDateError] = useState<string | null>(null)

  // Calendar month/year state for filtering
  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()) // 0-based

  const refreshSelectedDateEntries = useCallback(() => {
    if (!selectedDate || mode !== 'calendar') return
    setSelectedDateLoading(true)
    setSelectedDateError(null)
    getAllData({
      startDate: selectedDate,
      endDate: selectedDate,
      observationType: calendarObservationTypes.length ? calendarObservationTypes : undefined,
      symptomType: calendarSymptomTypes.length ? calendarSymptomTypes : undefined
    })
      .then((data) => {
        setSelectedDateEntries(data)
      })
      .catch((error: any) => {
        setSelectedDateError(error.message ?? 'Failed to load data for the selected date.')
        setSelectedDateEntries([])
      })
      .finally(() => {
        setSelectedDateLoading(false)
      })
  }, [selectedDate, calendarObservationTypes, calendarSymptomTypes, mode])

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
    })
  }, [mode, calendarObservationTypes, calendarSymptomTypes, calendarYear, calendarMonth])

  useEffect(() => {
    refreshSelectedDateEntries()
  }, [refreshSelectedDateEntries])

  return (
    <div className="App">
      <h1>Well-Being Data</h1>
      <div className="App__view-switcher">
        <button
          onClick={() => setMode('observation')}
          className={`App__view-button${mode === 'observation' ? ' App__view-button--active' : ''}`}
        >
          Observation
        </button>
        <button
          onClick={() => setMode('symptom')}
          className={`App__view-button${mode === 'symptom' ? ' App__view-button--active' : ''}`}
        >
          Symptom
        </button>
        <button
          onClick={() => setMode('calendar')}
          className={`App__view-button${mode === 'calendar' ? ' App__view-button--active' : ''}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setMode('dashboard')}
          className={`App__view-button${mode === 'dashboard' ? ' App__view-button--active' : ''}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setMode('explorer')}
          className={`App__view-button${mode === 'explorer' ? ' App__view-button--active' : ''}`}
        >
          Explorer
        </button>
        <button
          onClick={() => setShowApiTest((v) => !v)}
          className={`App__view-button App__view-button--outline${showApiTest ? ' App__view-button--active' : ''}`}
        >
          API Test
        </button>
        <button
          onClick={() => setShowAdmin((v) => !v)}
          className={`App__view-button App__view-button--outline${showAdmin ? ' App__view-button--active' : ''}`}
        >
          Admin
        </button>
      </div>
      {showAdmin ? (
        <WellBeingAdminPage />
      ) : showApiTest ? (
        <ApiTestPage />
      ) : mode === 'observation' ? (
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
      ) : mode === 'calendar' ? (
        <WellBeingCalendar
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
      ) : mode === 'dashboard' ? (
        <WellBeingDashboard />
      ) : (
        <WellBeingDataExplorer />
      )}
      {mode === 'calendar' && (
        <SelectedDateDetails
          date={selectedDate}
          entries={selectedDateEntries}
          isLoading={selectedDateLoading}
          error={selectedDateError}
          onRefresh={refreshSelectedDateEntries}
        />
      )}
    </div>
  )
}

export default App
