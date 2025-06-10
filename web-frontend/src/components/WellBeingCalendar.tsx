import React from 'react'
import { ObservationType, SymptomType } from '../types/enums'

export interface WellBeingCalendarProps {
  /** Dates to highlight, e.g. ['2025-06-01', ...] */
  highlightedDates: string[];
  /** Currently selected date (optional) */
  selectedDate?: string;
  /** Callback when a date is selected */
  onDateSelect?: (date: string) => void;
  /** Optional filter for observation type */
  observationType?: ObservationType;
  /** Optional filter for symptom type */
  symptomType?: SymptomType;
  /** Callback for observation type change */
  onObservationTypeChange?: (type: ObservationType) => void;
  /** Callback for symptom type change */
  onSymptomTypeChange?: (type: SymptomType) => void;
  calendarYear: number;
  calendarMonth: number; // 0-based
  setCalendarYear: (year: number) => void;
  setCalendarMonth: (month: number) => void;
  dateColorMap: Record<string, 'observation' | 'symptom' | 'both'>;
}

export const WellBeingCalendar: React.FC<WellBeingCalendarProps> = ({
  highlightedDates,
  dateColorMap,
  selectedDate,
  onDateSelect,
  observationType,
  symptomType,
  onObservationTypeChange,
  onSymptomTypeChange,
  calendarYear,
  calendarMonth,
  setCalendarYear,
  setCalendarMonth
}) => {
  // Helper to get enum options as { key: value }
  function getEnumOptions<T extends object>(e: T): Record<string, string> {
    return Object.values(e)
      .filter((val) => typeof val === 'string')
      .reduce((acc, val) => {
        acc[val as string] = val as string
        return acc
      }, {} as Record<string, string>)
  }

  // Calendar state for month navigation
  const today = new Date()

  const firstDay = new Date(calendarYear, calendarMonth, 1)
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay()

  // Build calendar grid
  const calendarDays: (string | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push(dateStr)
  }

  // Highlight logic
  const isHighlighted = (date: string) => highlightedDates.includes(date)

  // Color logic for each date
  const getDateColor = (date: string) => {
    switch (dateColorMap[date]) {
      case 'observation': return '#2563eb'; // blue
      case 'symptom': return '#dc2626'; // red
      case 'both': return '#9333ea'; // purple
      default: return '#f1f5f9'; // default bg
    }
  }
  const getTextColor = (date: string) => {
    switch (dateColorMap[date]) {
      case 'observation':
      case 'symptom':
      case 'both':
        return '#fff';
      default:
        return '#22223b';
    }
  }

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
        setCalendarYear(calendarYear - 1);
        setCalendarMonth(11);
    } else {
        setCalendarMonth(calendarMonth - 1);
    }
    };
    const handleNextMonth = () => {
    if (calendarMonth === 11) {
        setCalendarYear(calendarYear + 1);
        setCalendarMonth(0);
    } else {
        setCalendarMonth(calendarMonth + 1);
    }
    };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', marginBottom: 40, background: '#f8fafc', borderRadius: 16, boxShadow: '0 4px 24px rgba(100,108,255,0.10)', padding: 32, border: '1.5px solid #e0e7ff' }}>
      <h2 style={{ color: '#3b3b5c', marginBottom: 18, fontWeight: 700 }}>Calendar View</h2>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, background: '#2563eb', borderRadius: 4, display: 'inline-block', border: '1.5px solid #e0e7ff' }} /> Observation
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, background: '#dc2626', borderRadius: 4, display: 'inline-block', border: '1.5px solid #e0e7ff' }} /> Symptom
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, background: '#9333ea', borderRadius: 4, display: 'inline-block', border: '1.5px solid #e0e7ff' }} /> Both
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, gap: 16 }}>
        <button onClick={handlePrevMonth} style={{ fontSize: 20, padding: '2px 10px' }}>{'<'}</button>
        <span style={{ fontWeight: 600, fontSize: 18 }}>{monthNames[calendarMonth]} {calendarYear}</span>
        <button onClick={handleNextMonth} style={{ fontSize: 20, padding: '2px 10px' }}>{'>'}</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <select value={observationType ?? ''} onChange={e => onObservationTypeChange?.(e.target.value as ObservationType)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1.5px solid #c7d2fe', background: '#f1f5f9' }}>
          <option value="">All Observations</option>
          {Object.entries(getEnumOptions(ObservationType)).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>
        <select value={symptomType ?? ''} onChange={e => onSymptomTypeChange?.(e.target.value as SymptomType)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1.5px solid #c7d2fe', background: '#f1f5f9' }}>
          <option value="">All Symptoms</option>
          {Object.entries(getEnumOptions(SymptomType)).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, fontWeight: 600, color: '#6366f1' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {calendarDays.map((date, idx) =>
          date ? (
            <button
              key={date}
              onClick={() => onDateSelect?.(date)}
              style={{
                padding: 0,
                aspectRatio: '1/1',
                borderRadius: 8,
                border: selectedDate === date ? '2px solid #6366f1' : '1.5px solid #e0e7ff',
                background: getDateColor(date),
                color: getTextColor(date),
                fontWeight: dateColorMap[date] ? 700 : 500,
                cursor: 'pointer',
                fontSize: 16,
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              {Number(date.slice(-2))}
            </button>
          ) : (
            <div key={idx} />
          )
        )}
      </div>
    </div>
  )
}
