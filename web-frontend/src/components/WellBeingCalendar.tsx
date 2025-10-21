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
  filterCategories?: {
    key: string;
    label: string;
    options: { key: string; label: string; enabled: boolean }[];
  }[];
  filterLoading?: boolean;
  filterError?: string | null;
  onFilterToggle?: (categoryKey: string, typeKey: string) => void;
  onFilterToggleAll?: (categoryKey: string, enabled: boolean) => void;
  onFilterRetry?: () => void;
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
  filterCategories,
  filterLoading,
  filterError,
  onFilterToggle,
  onFilterToggleAll,
  onFilterRetry,
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
  const filterList = filterCategories ?? [];
  const isLoadingFilters = Boolean(filterLoading);
  const filterErrorMessage = filterError ?? '';
  const formatLabel = (label: string) =>
    label.length > 0 ? label.charAt(0).toUpperCase() + label.slice(1) : label;

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

      <div className="calendar__filters">
        <div className="calendar__filters-header">
          <h3>Types included in calendar</h3>
          {isLoadingFilters && (
            <span className="calendar__filters-status">Loading types…</span>
          )}
        </div>
        {filterErrorMessage && (
          <div className="calendar__filters-error">
            <span>{filterErrorMessage}</span>
            {onFilterRetry && (
              <button type="button" onClick={onFilterRetry}>
                Retry
              </button>
            )}
          </div>
        )}
        {filterList.length > 0 ? (
          filterList.map((category) => (
            <div key={category.key} className="calendar__filter-group">
              <div className="calendar__filter-group-header">
                <span className="calendar__filter-group-title">
                  {formatLabel(category.label)} types
                </span>
                {onFilterToggleAll && (
                  <div className="calendar__filter-group-actions">
                    <button
                      type="button"
                      onClick={() => onFilterToggleAll(category.key, true)}
                    >
                      Enable all
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterToggleAll(category.key, false)}
                    >
                      Disable all
                    </button>
                  </div>
                )}
              </div>
              {category.options.length > 0 ? (
                <div className="calendar__filter-options">
                  {category.options.map((option) => (
                    <label
                      key={option.key}
                      className={`calendar__filter-option${
                        option.enabled ? '' : ' calendar__filter-option--inactive'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={() => onFilterToggle?.(category.key, option.key)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="calendar__filters-empty">No types available.</p>
              )}
            </div>
          ))
        ) : !isLoadingFilters && !filterErrorMessage ? (
          <p className="calendar__filters-empty">
            No observation or symptom types were found.
          </p>
        ) : null}
      </div>

      {legendItems.length > 0 && (
        <div className="calendar__legend">
          {legendItems.map((item) => (
            <span key={item.key}>
              <span
                className="calendar__legend-color"
                style={{ background: item.color }}
              />
              {formatLabel(item.label)}
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
