'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { NotebookPen, Trash2, ArrowRight, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/useTaskStore';
import type { QuickNote } from '@/store/useTaskStore';
import { QuickNoteModal } from './QuickNoteModal';

export function NotesPage() {
  const { quickNotes, fetchQuickNotes, deleteQuickNote } = useTaskStore();
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [editNote, setEditNote] = useState<QuickNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickNotes().finally(() => setLoading(false));
  }, []);

  function handleEditClose() {
    setEditNote(null);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold c-text">Notizen</h1>
          <p className="c-muted mt-1 text-sm">Schnell erfasste Gedanken als Aufgaben</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setQuickNoteOpen(true)}>
          <Plus className="h-4 w-4" />
          Neue Notiz
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && quickNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <NotebookPen className="h-7 w-7 c-faint" />
          </div>
          <p className="c-muted text-sm">Noch keine Notizen vorhanden</p>
          <p className="c-faint text-xs mt-1">Erfasse schnell Gedanken – KI macht Aufgaben daraus</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setQuickNoteOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Erste Notiz erfassen
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {quickNotes.map((note) => (
          <div
            key={note.id}
            className="group rounded-xl border border-theme bg-surface p-4 space-y-3 animate-fade-in"
          >
            {/* Original note text */}
            <div
              className="text-sm c-text leading-relaxed note-editor"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {/* Converted task */}
            {note.task && (
              <div className="flex items-center gap-2 pt-2 border-t border-theme">
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs c-muted">Aufgabe: </span>
                  <span className="text-xs font-medium c-text">{note.task.title}</span>
                </div>
                <span
                  className={
                    note.task.status === 'done'
                      ? 'text-xs text-green-400'
                      : 'text-xs text-indigo-400'
                  }
                >
                  {note.task.status === 'done' ? 'erledigt' : 'offen'}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs c-faint">
                {format(new Date(note.created_at), "d. MMM, HH:mm 'Uhr'", { locale: de })}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:text-indigo-400"
                  onClick={() => setEditNote(note)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:text-red-400"
                  onClick={() => deleteQuickNote(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New note modal */}
      <QuickNoteModal
        open={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        onSaved={() => fetchQuickNotes()}
      />

      {/* Edit note modal */}
      <QuickNoteModal
        open={!!editNote}
        onClose={handleEditClose}
        onSaved={() => fetchQuickNotes()}
        editNote={editNote}
      />
    </div>
  );
}
