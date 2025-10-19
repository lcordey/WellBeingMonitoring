import React from 'react';

interface WellBeingCalendarProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  calendarYear: number;
  calendarMonth: number; // 0-based
  setCalendarYear: (year: number) => void;
  setCalendarMonth: (month: number) => void;
  dateCategoriesMap: Record<string, string[]>;
  categoryLabels: Record<string, string>;
  categoryColors: Record<string, string>;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getLegendItems = (
  categoryLabels: Record<string, string>,
  categoryColors: Record<string, string>
) => {
  const keys = Object.keys(categoryLabels).sort((a, b) =>
    categoryLabels[a].localeCompare(categoryLabels[b])
  );
  return keys.map((key) => ({
    key,
    label: categoryLabels[key],
    color: categoryColors[key] ?? '#6366f1',
  }));
};

const computeDayStyles = (
  date: string,
  dateCategoriesMap: Record<string, string[]>,
  categoryColors: Record<string, string>
) => {
  const categories = dateCategoriesMap[date] ?? [];
  if (!categories.length) {
    return {
      background: '#f1f5f9',
      color: '#22223b',
      fontWeight: 500,
    };
  }
  const palette = categories.map((category, index) => {
    const color = categoryColors[category] ?? '#6366f1';
    return { color, index };
  });
  const backgrounds = palette.map((item) => item.color);
  const background =
    backgrounds.length === 1
      ? backgrounds[0]
      : `linear-gradient(135deg, ${backgrounds.join(', ')})`;
  return {
    background,
    color: '#fff',
    fontWeight: 700,
  };
};

export const WellBeingCalendar: React.FC<WellBeingCalendarProps> = ({
  selectedDate,
  onDateSelect,
  calendarYear,
  calendarMonth,
  setCalendarYear,
  setCalendarMonth,
  dateCategoriesMap,
  categoryLabels,
  categoryColors,
}) => {
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push(dateStr);
  }

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

  const legendItems = getLegendItems(categoryLabels, categoryColors);

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div>
          <h2>Monthly activity</h2>
          <p className="calendar__subtitle">
            Highlighted days indicate dates with notable observations or symptoms captured.
          </p>
        </div>
        <div className="calendar__navigation">
          <button type="button" onClick={handlePrevMonth}>
            {'<'}
          </button>
          <span>
            {monthNames[calendarMonth]} {calendarYear}
          </span>
          <button type="button" onClick={handleNextMonth}>
            {'>'}
          </button>
        </div>
      </div>

      {legendItems.length > 0 && (
        <div className="calendar__legend">
          {legendItems.map((item) => (
            <span key={item.key}>
              <span
                className="calendar__legend-color"
                style={{ background: item.color }}
              />
              {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
            </span>
          ))}
        </div>
      )}

      <div className="calendar__weekday-row">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="calendar__grid">
        {calendarDays.map((date, index) =>
          date ? (
            <button
              key={date}
              type="button"
              onClick={() => onDateSelect?.(date)}
              className={`calendar__day ${selectedDate === date ? 'calendar__day--selected' : ''}`}
              style={computeDayStyles(date, dateCategoriesMap, categoryColors)}
            >
              {Number(date.slice(-2))}
            </button>
          ) : (
            <div key={`empty-${index}`} />
          )
        )}
      </div>
    </div>
  );
};

export default WellBeingCalendar;
