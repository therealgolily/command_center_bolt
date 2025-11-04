import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Bold, Type, Image } from 'lucide-react';
import { supabase, Note } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';

export function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('error loading notes:', error);
    } else {
      setNotes(data || []);
    }

    setLoading(false);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content;
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    setSaving(true);
    const contentToSave = editorRef.current?.innerHTML || '';

    try {
      if (selectedNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title.trim(),
            content: contentToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedNote.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{
            user_id: user.id,
            title: title.trim(),
            content: contentToSave,
          }])
          .select()
          .single();

        if (error) throw error;
        setSelectedNote(data);
      }

      await loadNotes();
    } catch (error) {
      console.error('error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', note.id);

    if (error) {
      console.error('error deleting note:', error);
    } else {
      setDeletingNote(null);
      if (selectedNote?.id === note.id) {
        handleNewNote();
      }
      await loadNotes();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      setUploadingImage(true);

      const selection = window.getSelection();
      let insertionPoint: Range | null = null;

      if (selection && selection.rangeCount > 0) {
        insertionPoint = selection.getRangeAt(0);
      }

      for (const file of validFiles) {
        const timestamp = Date.now() + Math.random();
        const fileName = `${user.id}/notes/${timestamp}-${file.name}`;

        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);

        const img = document.createElement('img');
        img.src = urlData.publicUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.borderRadius = '4px';

        if (insertionPoint) {
          insertionPoint.insertNode(img);
          insertionPoint.setStartAfter(img);
          insertionPoint.setEndAfter(img);
        } else if (editorRef.current) {
          editorRef.current.appendChild(img);
        }
      }

      if (selection && insertionPoint) {
        selection.removeAllRanges();
        selection.addRange(insertionPoint);
      }

      editorRef.current?.focus();
    } catch (error) {
      console.error('error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      <div className="w-80 bg-white rounded-lg border border-[#e2e8f0] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1e293b]">notes</h2>
          <button
            onClick={handleNewNote}
            className="p-2 text-[#3b82f6] hover:bg-blue-50 rounded-md transition-colors"
            title="New note"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm">
              no notes yet
              <br />
              create your first note
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-md cursor-pointer transition-colors group ${
                  selectedNote?.id === note.id
                    ? 'bg-blue-50 border border-[#3b82f6]'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1e293b] truncate">{note.title}</div>
                    <div className="text-xs text-[#64748b] mt-1">
                      {formatDate(note.updated_at)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNote(note);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#64748b] hover:text-[#ef4444] transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-[#e2e8f0] p-6 flex flex-col">
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="note title..."
            className="w-full px-4 py-2 text-xl font-semibold text-[#1e293b] border-b-2 border-[#e2e8f0] focus:outline-none focus:border-[#3b82f6] transition-colors"
            style={{ fontFamily: 'Courier New, monospace' }}
          />
        </div>

        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#e2e8f0]">
          <button
            onClick={() => execCommand('bold')}
            className="p-2 text-[#64748b] hover:bg-gray-100 rounded-md transition-colors"
            title="Bold"
          >
            <Bold size={18} />
          </button>

          <button
            onClick={() => execCommand('fontSize', '1')}
            className="px-2 py-1 text-xs text-[#64748b] hover:bg-gray-100 rounded-md transition-colors"
            title="Small text"
          >
            Small
          </button>

          <button
            onClick={() => execCommand('fontSize', '3')}
            className="px-2 py-1 text-sm text-[#64748b] hover:bg-gray-100 rounded-md transition-colors"
            title="Normal text"
          >
            Normal
          </button>

          <button
            onClick={() => execCommand('fontSize', '5')}
            className="px-2 py-1 text-base text-[#64748b] hover:bg-gray-100 rounded-md transition-colors"
            title="Large text"
          >
            Large
          </button>

          <button
            onClick={() => execCommand('fontSize', '7')}
            className="px-2 py-1 text-lg text-[#64748b] hover:bg-gray-100 rounded-md transition-colors"
            title="Extra large text"
          >
            XL
          </button>

          <div className="w-px h-6 bg-[#e2e8f0] mx-2"></div>

          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 text-[#64748b] hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Insert image"
          >
            <Image size={18} />
          </button>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex-1"></div>

          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'saving...' : 'save'}
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          className="flex-1 overflow-y-auto p-4 text-[#1e293b] focus:outline-none"
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            minHeight: '200px',
          }}
          placeholder="Start writing..."
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
        />
      </div>

      {deletingNote && (
        <ConfirmDialog
          title="delete note?"
          message={`are you sure you want to delete "${deletingNote.title}"? this cannot be undone.`}
          confirmText="delete"
          onConfirm={() => handleDelete(deletingNote)}
          onCancel={() => setDeletingNote(null)}
        />
      )}
    </div>
  );
}
