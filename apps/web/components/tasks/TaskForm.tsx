'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTaskStore, type Task, type CreateTaskInput } from '@/store/useTaskStore';

interface TaskFormProps {
  editTask?: Task;
  onSuccess?: () => void;
}

export function TaskForm({ editTask, onSuccess }: TaskFormProps) {
  const { createTask, updateTask, companies } = useTaskStore();

  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [dueDate, setDueDate] = useState(
    editTask?.due_date ? editTask.due_date.split('T')[0] : ''
  );
  const [status, setStatus] = useState(editTask?.status ?? 'open');
  const [category, setCategory] = useState(editTask?.category ?? 'work');
  const [priority, setPriority] = useState(editTask?.priority ?? 'medium');
  const [companyId, setCompanyId] = useState(editTask?.company_id ?? '');

  const [aiLoading, setAiLoading] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // AI: Extract date from title
  async function handleAiTitleBlur() {
    if (!title || dueDate) return;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: status as CreateTaskInput['status'],
        category: category as CreateTaskInput['category'],
        priority: priority as CreateTaskInput['priority'],
        company_id: companyId || undefined,
      };

      if (editTask) {
        await updateTask(editTask.id, input);
      } else {
        await createTask(input);
      }
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  }

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

      {/* Description with expand button */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Notizen / Beschreibung</Label>
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
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Stichpunkte oder Notizen..."
          rows={3}
        />
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

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {editTask ? 'Speichern' : 'Aufgabe erstellen'}
      </Button>
    </form>
  );
}
