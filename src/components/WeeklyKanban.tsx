import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Palette } from 'lucide-react';
import { supabase, StickyNote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_COLORS: Record<DayOfWeek, string> = {
  monday: 'from-red-400 to-red-600',
  tuesday: 'from-orange-400 to-orange-600',
  wednesday: 'from-yellow-400 to-yellow-600',
  thursday: 'from-green-400 to-green-600',
  friday: 'from-blue-400 to-blue-600',
  saturday: 'from-indigo-400 to-indigo-600',
  sunday: 'from-purple-400 to-purple-600',
};

const NOTE_COLORS: Record<NoteColor, { bg: string; text: string; border: string }> = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-400' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', border: 'border-pink-400' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400' },
  green: { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-400' },
};

function StickyNoteCard({ note, onDelete, onColorChange }: { note: StickyNote; onDelete: (id: string) => void; onColorChange: (id: string, color: NoteColor) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorStyle = NOTE_COLORS[note.color];

  const handleSave = async () => {
    if (!editContent.trim()) {
      onDelete(note.id);
      return;
    }

    await supabase
      .from('sticky_notes')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', note.id);

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colorStyle.bg} ${colorStyle.text} p-4 rounded-lg border-2 ${colorStyle.border} shadow-md cursor-grab active:cursor-grabbing relative group min-h-[100px]`}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowColorPicker(!showColorPicker);
        }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
        title="Change color"
      >
        <Palette size={14} />
      </button>

      {showColorPicker && (
        <div className="absolute top-8 left-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-1 z-10">
          {(Object.keys(NOTE_COLORS) as NoteColor[]).map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation();
                onColorChange(note.id, color);
                setShowColorPicker(false);
              }}
              className={`w-6 h-6 rounded ${NOTE_COLORS[color].bg} border-2 ${NOTE_COLORS[color].border} hover:scale-110 transition-transform`}
              title={color}
            />
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded"
        title="Delete note"
      >
        <Trash2 size={14} />
      </button>

      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`w-full ${colorStyle.bg} ${colorStyle.text} resize-none focus:outline-none font-handwriting text-sm`}
          style={{ minHeight: '60px' }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="whitespace-pre-wrap break-words font-handwriting text-sm cursor-text"
        >
          {note.content}
        </div>
      )}
    </div>
  );
}

function DayColumn({
  day,
  notes,
  onAddNote,
  onDeleteNote,
  onColorChange
}: {
  day: DayOfWeek;
  notes: StickyNote[];
  onAddNote: (day: DayOfWeek) => void;
  onDeleteNote: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
}) {
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div className={`bg-gradient-to-br ${DAY_COLORS[day]} p-4 rounded-t-lg shadow-lg`}>
        <h3 className="text-white font-bold text-lg uppercase text-center tracking-wider">
          {day}
        </h3>
      </div>
      <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 bg-gray-50 p-3 space-y-3 min-h-[400px] rounded-b-lg border-2 border-t-0 border-gray-200">
          {notes.map((note) => (
            <StickyNoteCard key={note.id} note={note} onDelete={onDeleteNote} onColorChange={onColorChange} />
          ))}
          <button
            onClick={() => onAddNote(day)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-white transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">add note</span>
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

export function WeeklyKanban() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<StickyNote | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error loading notes:', error);
    } else {
      setNotes(data || []);
    }

    setLoading(false);
  };

  const handleAddNote = async (day: DayOfWeek) => {
    if (!user) return;

    const dayNotes = notes.filter((n) => n.day_of_week === day);
    const maxPosition = dayNotes.length > 0 ? Math.max(...dayNotes.map((n) => n.position)) : -1;

    const colors: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([{
        user_id: user.id,
        content: 'new note...',
        day_of_week: day,
        position: maxPosition + 1,
        color: randomColor,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
    } else {
      setNotes([...notes, data]);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('sticky_notes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
    } else {
      setNotes(notes.filter((n) => n.id !== id));
    }
  };

  const handleColorChange = async (id: string, color: NoteColor) => {
    const { error } = await supabase
      .from('sticky_notes')
      .update({ color, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating color:', error);
    } else {
      setNotes(notes.map((n) => (n.id === id ? { ...n, color } : n)));
    }
  };

  const handleDragStart = (event: any) => {
    const note = notes.find((n) => n.id === event.active.id);
    setActiveNote(note || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveNote(null);

    const { active, over } = event;

    if (!over) return;

    const activeNote = notes.find((n) => n.id === active.id);
    if (!activeNote) return;

    const overNote = notes.find((n) => n.id === over.id);
    let newDay = activeNote.day_of_week;
    let newPosition = activeNote.position;

    if (overNote) {
      newDay = overNote.day_of_week;
      const dayNotes = notes.filter((n) => n.day_of_week === newDay && n.id !== activeNote.id);
      const overIndex = dayNotes.findIndex((n) => n.id === overNote.id);
      newPosition = overIndex >= 0 ? overIndex : dayNotes.length;
    }

    if (newDay !== activeNote.day_of_week || newPosition !== activeNote.position) {
      const updatedNotes = notes.map((n) => {
        if (n.id === activeNote.id) {
          return { ...n, day_of_week: newDay, position: newPosition };
        }
        if (n.day_of_week === newDay && n.id !== activeNote.id) {
          if (n.position >= newPosition) {
            return { ...n, position: n.position + 1 };
          }
        }
        return n;
      });

      setNotes(updatedNotes);

      await supabase
        .from('sticky_notes')
        .update({
          day_of_week: newDay,
          position: newPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeNote.id);

      for (const note of updatedNotes.filter((n) => n.day_of_week === newDay && n.id !== activeNote.id)) {
        await supabase
          .from('sticky_notes')
          .update({ position: note.position, updated_at: new Date().toISOString() })
          .eq('id', note.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1e293b]">weekly kanban</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DAYS.map((day) => {
            const dayNotes = notes
              .filter((n) => n.day_of_week === day)
              .sort((a, b) => a.position - b.position);

            return (
              <DayColumn
                key={day}
                day={day}
                notes={dayNotes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onColorChange={handleColorChange}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeNote ? (
            <div
              className={`${NOTE_COLORS[activeNote.color].bg} ${NOTE_COLORS[activeNote.color].text} p-4 rounded-lg border-2 ${NOTE_COLORS[activeNote.color].border} shadow-xl min-h-[100px] opacity-90`}
            >
              <div className="whitespace-pre-wrap break-words font-handwriting text-sm">
                {activeNote.content}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
