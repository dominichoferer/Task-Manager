'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, X, Bold, Italic, Underline, List, ListOrdered, Type, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/useTaskStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { QuickNote } from '@/store/useTaskStore';

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editNote?: QuickNote | null;
}

export function QuickNoteModal({ open, onClose, onSaved, editNote }: QuickNoteModalProps) {
  const { saveQuickNoteOnly, saveQuickNote, updateQuickNote } = useTaskStore();
  const [saving, setSaving] = useState<'note' | 'task' | 'update' | null>(null);
  const [saved, setSaved] = useState<{ type: 'note' | 'task' | 'update'; title?: string } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const isEdit = !!editNote;

  useEffect(() => {
    if (open) {
      setSaved(null);
      setSaveError(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = editNote?.content ?? '';
        const text = editorRef.current.innerText?.trim() ?? '';
        setIsEmpty(text.length === 0);
      }
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [open, editNote]);

  function execFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  function handleInput() {
    const text = editorRef.current?.innerText?.trim() ?? '';
    setIsEmpty(text.length === 0);
  }

  function getPlainText() {
    return editorRef.current?.innerText?.trim() ?? '';
  }

  function getHtml() {
    return editorRef.current?.innerHTML ?? '';
  }

  async function handleUpdate() {
    if (!editNote || !getPlainText()) return;
    setSaving('update');
    setSaveError(null);
    try {
      await updateQuickNote(editNote.id, getHtml());
      setSaved({ type: 'update' });
      onSaved?.();
      setTimeout(() => { onClose(); setSaved(null); }, 1200);
    } catch (err) {
      const e = err as { message?: string; details?: string };
      setSaveError(e?.message ?? e?.details ?? JSON.stringify(err));
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveNote() {
    if (!getPlainText()) return;
    setSaving('note');
    setSaveError(null);
    try {
      await saveQuickNoteOnly(getHtml());
      setSaved({ type: 'note' });
      onSaved?.();
      setTimeout(() => { onClose(); setSaved(null); }, 1600);
    } catch (err) {
      const e = err as { message?: string; details?: string };
      setSaveError(e?.message ?? e?.details ?? JSON.stringify(err));
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateTask() {
    if (!getPlainText()) return;
    setSaving('task');
    setSaveError(null);
    try {
      const { task } = await saveQuickNote(getPlainText());
      setSaved({ type: 'task', title: task.title });
      onSaved?.();
      setTimeout(() => { onClose(); setSaved(null); }, 1800);
    } catch (err) {
      const e = err as { message?: string; details?: string };
      setSaveError(e?.message ?? e?.details ?? JSON.stringify(err));
    } finally {
      setSaving(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      isEdit ? handleUpdate() : handleSaveNote();
    }
  }

  if (!open) return null;

  const dateStr = editNote
    ? format(new Date(editNote.created_at), "d. MMMM yyyy 'um' HH:mm", { locale: de })
    : format(new Date(), "d. MMMM yyyy 'um' HH:mm", { locale: de });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          'relative w-full sm:max-w-xl bg-dialog border border-theme rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in',
          'flex flex-col overflow-hidden'
        )}
        style={{ maxHeight: '82vh', minHeight: '420px' }}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-theme">
          {isEdit && (
            <span className="text-xs c-faint px-1.5 py-0.5 rounded bg-surface mr-1">Bearbeiten</span>
          )}
          <ToolbarBtn title="Fett" onClick={() => execFormat('bold')}>
            <Bold className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Kursiv" onClick={() => execFormat('italic')}>
            <Italic className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Unterstrichen" onClick={() => execFormat('underline')}>
            <Underline className="h-4 w-4" />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn title="Überschrift" onClick={() => execFormat('formatBlock', 'h3')}>
            <Type className="h-4 w-4" />
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn title="Aufzählung" onClick={() => execFormat('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Nummerierte Liste" onClick={() => execFormat('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarBtn>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-md c-subtle hover:c-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Date */}
        <p className="text-xs c-faint text-center pt-2 pb-1 select-none">{dateStr}</p>

        {/* Editor area */}
        {saved ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in py-8">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-3',
              saved.type === 'task' ? 'bg-indigo-500/20' : 'bg-green-500/20'
            )}>
              {saved.type === 'update' ? (
                <Check className="h-6 w-6 text-green-400" />
              ) : (
                <Sparkles className={cn('h-6 w-6', saved.type === 'task' ? 'text-indigo-400' : 'text-green-400')} />
              )}
            </div>
            <p className="text-sm font-medium c-text">
              {saved.type === 'task' ? 'Aufgabe erstellt' : saved.type === 'update' ? 'Notiz aktualisiert' : 'Notiz gespeichert'}
            </p>
            {saved.title && (
              <p className="text-xs c-muted mt-1 line-clamp-2 px-8 text-center">{saved.title}</p>
            )}
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            data-placeholder="Notiz einfach eintippen…"
            className="note-editor flex-1 px-5 py-3 text-sm c-text focus:outline-none overflow-y-auto"
          />
        )}

        {/* Footer */}
        {!saved && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
            <p className="text-xs c-faint items-center gap-1 hidden sm:flex">
              <Sparkles className="h-3 w-3 text-indigo-400/60" />
              {isEdit ? 'Änderungen mit Strg+Enter speichern' : 'KI kann eine Aufgabe daraus erstellen'}
            </p>
            {saveError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 max-w-xs truncate" title={saveError}>
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {isEdit ? (
                <Button
                  onClick={handleUpdate}
                  disabled={!!saving || isEmpty}
                  size="sm"
                  className="gap-1.5"
                >
                  {saving === 'update' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving === 'update' ? 'Speichert…' : 'Speichern'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveNote}
                    disabled={!!saving || isEmpty}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    {saving === 'note' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saving === 'note' ? 'Speichert…' : 'Speichern'}
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!!saving || isEmpty}
                    size="sm"
                    className="gap-1.5"
                  >
                    {saving === 'task' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {saving === 'task' ? 'KI verarbeitet…' : 'Als Aufgabe'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 rounded-lg hover:bg-surface-md c-muted hover:c-text transition-colors"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--c-border)' }} />;
}
