import { useState } from 'react';

type ViewMode = 1 | 3 | 6 | 12;

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(1);

  const getTodayInEST = () => {
    const now = new Date();
    const estOffset = -5;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const estDate = new Date(utc + (3600000 * estOffset));
    return estDate;
  };

  const getCurrentMonth = () => {
    const today = getTodayInEST();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const generateMonthData = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthName: firstDay.toLocaleDateString('en-US', { month: 'long' }), year };
  };

  const getMonthsToDisplay = (): Array<{ year: number; month: number }> => {
    const { year, month } = getCurrentMonth();
    const months: Array<{ year: number; month: number }> = [];

    for (let i = 0; i < viewMode; i++) {
      const targetMonth = month + i;
      const targetYear = year + Math.floor(targetMonth / 12);
      const adjustedMonth = targetMonth % 12;
      months.push({ year: targetYear, month: adjustedMonth });
    }

    return months;
  };

  const isToday = (year: number, month: number, day: number | null) => {
    if (day === null) return false;
    const today = getTodayInEST();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const months = getMonthsToDisplay();

  const gridCols = {
    1: 'grid-cols-1',
    3: 'grid-cols-3',
    6: 'grid-cols-3',
    12: 'grid-cols-4',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1e293b]">calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(1)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 1
                ? 'bg-[#3b82f6] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
            }`}
          >
            1 month
          </button>
          <button
            onClick={() => setViewMode(3)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 3
                ? 'bg-[#3b82f6] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
            }`}
          >
            3 months
          </button>
          <button
            onClick={() => setViewMode(6)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 6
                ? 'bg-[#3b82f6] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
            }`}
          >
            6 months
          </button>
          <button
            onClick={() => setViewMode(12)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 12
                ? 'bg-[#3b82f6] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
            }`}
          >
            12 months
          </button>
        </div>
      </div>

      <div className={`grid ${gridCols[viewMode]} gap-6`}>
        {months.map(({ year, month }) => {
          const { weeks, monthName } = generateMonthData(year, month);

          return (
            <div key={`${year}-${month}`} className="bg-white rounded-lg border border-[#e2e8f0] p-4">
              <h3 className="text-lg font-semibold text-[#1e293b] mb-4 text-center">
                {monthName} {year}
              </h3>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-xs font-semibold text-[#64748b] text-center py-2 uppercase"
                  >
                    {day}
                  </div>
                ))}

                {weeks.map((week, weekIdx) => (
                  week.map((day, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`aspect-square flex items-center justify-center text-sm rounded ${
                        day === null
                          ? 'text-transparent'
                          : isToday(year, month, day)
                          ? 'bg-[#3b82f6] text-white font-bold'
                          : 'text-[#1e293b] hover:bg-gray-50'
                      }`}
                    >
                      {day !== null ? day : ''}
                    </div>
                  ))
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
