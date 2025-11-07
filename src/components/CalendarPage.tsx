import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { supabase, StickyNote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 1 | 3 | 6 | 12;

const NOTE_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-300' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', border: 'border-pink-300' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-300' },
  green: { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-300' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-300' },
};

function DraggableStickyNote({ note }: { note: StickyNote }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const isInCalendar = note.assigned_date !== null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${NOTE_COLORS[note.color].bg} ${NOTE_COLORS[note.color].text} ${
        isInCalendar ? 'p-1 text-[9px]' : 'p-2 text-xs'
      } rounded leading-tight border ${NOTE_COLORS[note.color].border} cursor-move hover:shadow-md transition-shadow`}
    >
      <div className="whitespace-pre-wrap break-words font-handwriting">
        {note.content}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>(1);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [activeNote, setActiveNote] = useState<StickyNote | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

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

  const getDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getNotesForDate = (dateString: string) => {
    return notes.filter((n) => n.assigned_date === dateString);
  };

  const getUnassignedNotes = () => {
    return notes.filter((n) => n.assigned_date === null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const note = notes.find((n) => n.id === event.active.id);
    setActiveNote(note || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);

    if (!over || !user) return;

    const noteId = active.id as string;
    const targetDateString = over.id as string;

    if (!targetDateString.startsWith('date-')) return;

    const dateString = targetDateString.replace('date-', '');

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, assigned_date: dateString } : n
      )
    );

    const { error } = await supabase
      .from('sticky_notes')
      .update({ assigned_date: dateString })
      .eq('id', noteId);

    if (error) {
      console.error('error updating note:', error);
      loadNotes();
    }
  };

  const handleAddNote = async (dateString: string) => {
    if (!user) return;

    const content = prompt('Enter note:');
    if (!content) return;

    const { error } = await supabase.from('sticky_notes').insert([{
      user_id: user.id,
      content,
      assigned_date: dateString,
      day_of_week: 'monday',
      position: 0,
      color: 'yellow',
      week_number: 0,
    }]);

    if (!error) {
      loadNotes();
    }
  };

  const months = getMonthsToDisplay();

  const gridCols = {
    1: 'grid-cols-1',
    3: 'grid-cols-3',
    6: 'grid-cols-3',
    12: 'grid-cols-4',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  const unassignedNotes = getUnassignedNotes();

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

        {unassignedNotes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">unassigned notes - drag to calendar</h3>
            <div className="flex flex-wrap gap-2">
              {unassignedNotes.map((note) => (
                <DraggableStickyNote key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

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
                    week.map((day, dayIdx) => {
                      if (day === null) {
                        return (
                          <div
                            key={`${weekIdx}-${dayIdx}`}
                            className="aspect-square text-transparent"
                          />
                        );
                      }

                      const dateString = getDateString(year, month, day);
                      const dayNotes = getNotesForDate(dateString);

                      return (
                        <DroppableDay
                          key={`${weekIdx}-${dayIdx}`}
                          dateString={dateString}
                          day={day}
                          isToday={isToday(year, month, day)}
                          notes={dayNotes}
                          onAddNote={() => handleAddNote(dateString)}
                        />
                      );
                    })
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeNote ? (
          <div
            className={`${NOTE_COLORS[activeNote.color].bg} ${NOTE_COLORS[activeNote.color].text} p-2 rounded border-2 ${NOTE_COLORS[activeNote.color].border} shadow-xl opacity-90 text-xs`}
          >
            <div className="whitespace-pre-wrap break-words font-handwriting">
              {activeNote.content}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableDay({
  dateString,
  day,
  isToday,
  notes,
  onAddNote,
}: {
  dateString: string;
  day: number;
  isToday: boolean;
  notes: StickyNote[];
  onAddNote: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${dateString}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`aspect-square flex flex-col text-sm rounded p-1 transition-all ${
        isToday
          ? 'bg-[#3b82f6] text-white font-bold'
          : isOver
          ? 'bg-blue-100 border-2 border-[#3b82f6]'
          : 'text-[#1e293b] hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <span className={`text-xs ${isToday ? 'font-bold' : ''}`}>{day}</span>
        {notes.length === 0 && !isToday && (
          <button
            onClick={onAddNote}
            className="opacity-0 hover:opacity-100 text-[#64748b] hover:text-[#3b82f6] transition-opacity"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {notes.map((note) => (
          <DraggableStickyNote key={note.id} note={note} />
        ))}
      </div>
      {notes.length > 0 && (
        <button
          onClick={onAddNote}
          className="mt-1 w-full text-center text-[9px] text-[#64748b] hover:text-[#3b82f6] opacity-0 hover:opacity-100 transition-opacity"
        >
          <Plus size={10} className="mx-auto" />
        </button>
      )}
    </div>
  );
}
