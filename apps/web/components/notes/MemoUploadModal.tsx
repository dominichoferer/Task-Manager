'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';

interface MemoUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type Step = 'upload' | 'analyzing' | 'review' | 'saving' | 'done' | 'error';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export function MemoUploadModal({ open, onClose, onSaved }: MemoUploadModalProps) {
  const { createTask, companies } = useTaskStore();
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setTitle('');
    setDescription('');
    setCompanyId('');
    setErrorMsg('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pickFile(picked: File) {
    if (!ACCEPTED.includes(picked.type)) {
      setErrorMsg('Nur Bilder (JPG, PNG, GIF, WEBP) und PDFs werden unterstützt.');
      return;
    }
    setFile(picked);
    setErrorMsg('');
    if (picked.type.startsWith('image/')) {
      const url = URL.createObjectURL(picked);
      setPreview(url);
    } else {
      setPreview(null);
    }
    analyze(picked);
  }

  async function analyze(f: File) {
    setStep('analyzing');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/ai/extract-from-file', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setTitle(data.title || '');
      setDescription(data.description || '');

      // Auto-detect company from hint or title/description text
      if (companies.length) {
        const haystack = [data.title, data.description, data.company_hint].filter(Boolean).join(' ');
        const sorted = [...companies].sort((a, b) => b.name.length - a.name.length);
        for (const c of sorted) {
          const en = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const ea = c.abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp(`\\b${en}\\b`, 'i').test(haystack) || new RegExp(`\\b${ea}\\b`, 'i').test(haystack)) {
            setCompanyId(c.id);
            break;
          }
        }
      }

      setStep('review');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Analyse fehlgeschlagen');
      setStep('error');
    }
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setStep('saving');
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'open',
        category: 'work',
        priority: 'medium',
        company_id: companyId || undefined,
      });
      setStep('done');
      onSaved?.();
      setTimeout(() => { handleClose(); }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Fehler beim Erstellen');
      setStep('error');
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const picked = e.dataTransfer.files[0];
    if (picked) pickFile(picked);
  }, [companies]); // eslint-disable-line

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative w-full sm:max-w-lg bg-dialog border border-theme rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium c-text">Memo / Dokument importieren</span>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-md c-subtle hover:c-text transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload zone */}
          {step === 'upload' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all',
                  dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-theme hover:border-indigo-500/50 hover:bg-surface-md'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium c-text">Datei hier ablegen oder klicken</p>
                  <p className="text-xs c-faint mt-1">Screenshot, Foto, PDF — KI erstellt daraus eine Aufgabe</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs c-faint px-2 py-1 rounded bg-surface border border-theme">
                    <ImageIcon className="h-3 w-3" /> JPG / PNG / WEBP
                  </span>
                  <span className="flex items-center gap-1 text-xs c-faint px-2 py-1 rounded bg-surface border border-theme">
                    <FileText className="h-3 w-3" /> PDF
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
            </>
          )}

          {/* Analyzing */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              {preview && (
                <img src={preview} alt="preview" className="max-h-32 rounded-lg object-contain border border-theme" />
              )}
              {!preview && file && (
                <div className="w-14 h-14 rounded-xl bg-surface border border-theme flex items-center justify-center">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
              )}
              <div className="flex items-center gap-2 c-muted text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                KI analysiert…
              </div>
            </div>
          )}

          {/* Review */}
          {step === 'review' && (
            <>
              {preview && (
                <img src={preview} alt="preview" className="max-h-28 rounded-lg object-contain border border-theme w-full" />
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs c-muted font-medium">Aufgabe</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs c-muted font-medium">Beschreibung</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="text-sm" />
                </div>

                {companies.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs c-muted font-medium">Firma</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCompanyId('')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs border transition-all',
                          !companyId ? 'bg-indigo-600 text-white border-indigo-600' : 'border-theme c-muted hover:c-text'
                        )}
                      >
                        Keine
                      </button>
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCompanyId(c.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs border transition-all flex items-center gap-1.5',
                            companyId === c.id ? 'text-white border-transparent' : 'border-theme c-muted hover:c-text'
                          )}
                          style={companyId === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.abbreviation}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm font-medium c-text">Aufgabe erstellt</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm c-text">Fehler</p>
              <p className="text-xs c-muted">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={reset}>Nochmal versuchen</Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
            <p className="text-xs c-faint flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400/60" />
              KI-Vorschlag — bitte prüfen
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={reset}>Zurück</Button>
              <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
                Aufgabe erstellen
              </Button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="px-4 py-3 border-t border-theme flex justify-end">
            <Button size="sm" disabled>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Erstellt…
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
