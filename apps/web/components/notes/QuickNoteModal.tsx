'use client';

import { useState, useRef, useEffect } from 'react';
import { NotebookPen, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/useTaskStore';
import { cn } from '@/lib/utils';

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function QuickNoteModal({ open, onClose, onSaved }: QuickNoteModalProps) {
  const { saveQuickNote } = useTaskStore();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ title: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent('');
      setSaved(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { task } = await saveQuickNote(content.trim());
      setSaved({ title: task.title });
      onSaved?.();
      setTimeout(() => {
        onClose();
        setSaved(null);
      }, 1800);
    } catch {
      // show error?
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full sm:max-w-lg bg-dialog border border-theme rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in',
        'p-5 sm:p-6'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <NotebookPen className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold c-text">Schnellnotiz</span>
          </div>
          <button onClick={onClose} className="c-subtle hover:c-text transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Saved confirmation */}
        {saved ? (
          <div className="py-6 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-sm font-medium c-text">Aufgabe erstellt</p>
            <p className="text-xs c-muted mt-1 line-clamp-2">{saved.title}</p>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Notiz einfach eintippen… KI wandelt sie automatisch in eine Aufgabe um."
              rows={5}
              className="w-full rounded-xl border border-theme bg-input px-4 py-3 text-sm c-text placeholder:c-faint focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs c-faint flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-400/60" />
                KI erkennt Titel und Punkte automatisch
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs c-faint hidden sm:block">⌘+Enter</span>
                <Button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  size="sm"
                  className="gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {saving ? 'KI verarbeitet…' : 'Als Aufgabe speichern'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
