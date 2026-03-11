'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, Wand2, List, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTaskStore, type Task, type CreateTaskInput, type TaskAttachment } from '@/store/useTaskStore';

interface TaskFormProps {
  editTask?: Task;
  onSuccess?: () => void;
}

export function TaskForm({ editTask, onSuccess }: TaskFormProps) {
  const { createTask, updateTask, uploadAttachment, companies } = useTaskStore();

  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [dueDate, setDueDate] = useState(
    editTask?.due_date ? editTask.due_date.split('T')[0] : ''
  );
  const [status, setStatus] = useState(editTask?.status ?? 'open');
  const [category, setCategory] = useState(editTask?.category ?? 'work');
  const [priority, setPriority] = useState(editTask?.priority ?? 'medium');
  const [companyId, setCompanyId] = useState(editTask?.company_id ?? '');
  const [attachments, setAttachments] = useState<TaskAttachment[]>(editTask?.attachments ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI: Extract date from title
  async function handleAiTitleBlur() {
    if (!title) return;
    // Company detection (always runs)
    if (!companyId) {
      const found = detectCompany(title + ' ' + description, companies);
      if (found) setCompanyId(found.id);
    }
    if (dueDate) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/extract-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: title }),
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.due_date) setDueDate(data.due_date);
    } catch {
      // silent fail
    } finally {
      setAiLoading(false);
    }
  }

  function handleDescriptionBlur() {
    if (!companyId) {
      const found = detectCompany(title + ' ' + description, companies);
      if (found) setCompanyId(found.id);
    }
  }

  // AI: Expand notes
  async function handleExpandNotes() {
    if (!description) return;
    setExpandLoading(true);
    try {
      const res = await fetch('/api/ai/expand-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: description, taskTitle: title }),
      });
      const data = await res.json();
      if (data.expanded) setDescription(data.expanded);
    } catch {
      // silent fail
    } finally {
      setExpandLoading(false);
    }
  }

  // Insert bullet point at cursor
  function insertBullet() {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = description.slice(0, pos);
    const after = description.slice(pos);
    const lastNewline = before.lastIndexOf('\n');
    const currentLine = before.slice(lastNewline + 1);

    let newVal: string;
    let newPos: number;
    if (currentLine === '') {
      newVal = before + '- ' + after;
      newPos = pos + 2;
    } else {
      newVal = before + '\n- ' + after;
      newPos = pos + 3;
    }
    setDescription(newVal);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = newPos;
      ta.focus();
    }, 0);
  }

  // File picker
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  }

  function removePendingFile(idx: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setSaveError(null);
    try {
      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: status as CreateTaskInput['status'],
        category: category as CreateTaskInput['category'],
        priority: priority as CreateTaskInput['priority'],
        company_id: companyId || undefined,
        attachments,
      };

      let taskId: string;
      if (editTask) {
        await updateTask(editTask.id, input);
        taskId = editTask.id;
      } else {
        const newTask = await createTask(input);
        taskId = newTask.id;
      }

      // Upload pending files and update task with new attachments
      if (pendingFiles.length > 0) {
        const uploaded: TaskAttachment[] = [];
        for (const file of pendingFiles) {
          const att = await uploadAttachment(taskId, file);
          uploaded.push(att);
        }
        await updateTask(taskId, { attachments: [...attachments, ...uploaded] });
      }

      onSuccess?.();
    } catch (err) {
      const e = err as { message?: string; details?: string; code?: string };
      setSaveError(e?.message ?? e?.details ?? JSON.stringify(err));
    } finally {
      setSaving(false);
    }
  }

  const totalFiles = attachments.length + pendingFiles.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title with AI */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Aufgabe</Label>
        <div className="relative">
          <Input
            id="title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleAiTitleBlur}
            placeholder="z.B. Grafik Arbeit bis morgen..."
            className="pr-8"
            required
          />
          {aiLoading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-indigo-400 animate-spin" />
          )}
          {!aiLoading && (
            <Sparkles className="absolute right-2.5 top-2.5 h-4 w-4 text-white/20" />
          )}
        </div>
        <p className="text-xs text-white/30">KI erkennt Datum automatisch beim Verlassen des Feldes</p>
      </div>

      {/* Description with toolbar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Notizen / Beschreibung</Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={insertBullet}
              title="Aufzählungspunkt einfügen"
              className="h-6 text-xs gap-1 text-white/50 hover:text-white"
            >
              <List className="h-3 w-3" />
              Liste
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExpandNotes}
              disabled={expandLoading || !description}
              className="h-6 text-xs gap-1"
            >
              {expandLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              Ausformulieren
            </Button>
          </div>
        </div>
        <Textarea
          id="description"
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Stichpunkte oder Notizen... (mit 'Liste' Aufzählungspunkte hinzufügen)"
          rows={3}
        />
      </div>

      {/* File attachments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Anhänge</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 text-xs gap-1 text-white/50 hover:text-white"
          >
            <Paperclip className="h-3 w-3" />
            Datei anhängen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {totalFiles > 0 && (
          <div className="space-y-1.5">
            {/* Existing attachments */}
            {attachments.map((att) => (
              <div
                key={att.url}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                {att.type.startsWith('image/') ? (
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                )}
                <span className="text-xs text-white/70 truncate flex-1">{att.name}</span>
                <span className="text-xs text-white/30">{(att.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.url)}
                  className="text-white/30 hover:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Pending files (not yet uploaded) */}
            {pendingFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                )}
                <span className="text-xs text-white/70 truncate flex-1">{file.name}</span>
                <span className="text-xs text-indigo-400/60">neu</span>
                <button
                  type="button"
                  onClick={() => removePendingFile(idx)}
                  className="text-white/30 hover:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <Label htmlFor="due_date">Fälligkeitsdatum</Label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="[color-scheme:dark]"
        />
      </div>

      {/* Row: Category + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategorie</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Firma</SelectItem>
              <SelectItem value="private">Privat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Priorität</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="medium">Mittel</SelectItem>
              <SelectItem value="low">Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Company */}
      {companies.length > 0 && (
        <div className="space-y-1.5">
          <Label>Firma</Label>
          <Select value={companyId || '_none'} onValueChange={(v) => setCompanyId(v === '_none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Keine Firma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Keine Firma</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name} ({c.abbreviation})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status (only when editing) */}
      {editTask && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in-progress">In Bearbeitung</SelectItem>
              <SelectItem value="done">Erledigt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {saveError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 break-all">
          Fehler: {saveError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {editTask ? 'Speichern' : 'Aufgabe erstellen'}
      </Button>
    </form>
  );
}

import type { Company } from '@/store/useTaskStore';

function detectCompany(text: string, companies: Company[]): Company | null {
  if (!text || !companies.length) return null;
  const sorted = [...companies].sort((a, b) => b.name.length - a.name.length);
  for (const c of sorted) {
    const escapedName = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedAbbr = c.abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escapedName}\\b`, 'i').test(text)) return c;
    if (new RegExp(`\\b${escapedAbbr}\\b`, 'i').test(text)) return c;
  }
  return null;
}
