'use client';

import { useState } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Trash2, Pencil, CalendarDays, Building2, FileText, Image as ImageIcon, Paperclip, AlignLeft, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task, TaskAttachment } from '@/store/useTaskStore';
import { useTaskStore } from '@/store/useTaskStore';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  isDraggable?: boolean;
}

function formatDueDate(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr);
  if (isToday(date)) return { label: 'Heute', urgent: true };
  if (isTomorrow(date)) return { label: 'Morgen', urgent: false };
  if (isPast(date)) return { label: format(date, 'dd.MM.yyyy', { locale: de }), urgent: true };
  return { label: format(date, 'dd.MM.yyyy', { locale: de }), urgent: false };
}

const priorityColors = {
  high: 'bg-red-500 border-red-600 text-white',
  medium: 'bg-amber-400 border-amber-500 text-white',
  low: 'bg-green-500 border-green-600 text-white',
};

function DescriptionRenderer({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const hasBullets = lines.some((l) => l.startsWith('- '));

  if (!hasBullets) {
    return <p className="text-xs c-muted line-clamp-3">{text}</p>;
  }

  return (
    <ul className="space-y-0.5">
      {lines.map((line, i) =>
        line.startsWith('- ') ? (
          <li key={i} className="flex items-start gap-1.5 text-xs c-muted">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-surface-md flex-shrink-0" style={{ backgroundColor: 'var(--c-border-md)' }} />
            <span>{line.slice(2)}</span>
          </li>
        ) : (
          <li key={i} className="text-xs c-muted pl-3">{line}</li>
        )
      )}
    </ul>
  );
}

function AttachmentChip({ att }: { att: TaskAttachment }) {
  const isImage = att.type.startsWith('image/');
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-theme text-xs c-subtle hover:c-text hover:border-theme-md transition-all max-w-[140px]"
    >
      {isImage ? (
        <ImageIcon className="h-3 w-3 flex-shrink-0" />
      ) : (
        <FileText className="h-3 w-3 flex-shrink-0" />
      )}
      <span className="truncate">{att.name}</span>
    </a>
  );
}

export function TaskCard({ task, onEdit, isDraggable }: TaskCardProps) {
  const { toggleTaskStatus, deleteTask } = useTaskStore();
  const [deleting, setDeleting] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const isDone = task.status === 'done';
  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null;
  const hasAttachments = task.attachments && task.attachments.length > 0;

  async function handleDelete() {
    setDeleting(true);
    await deleteTask(task.id);
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 animate-fade-in',
        isDone
          ? 'border-theme bg-surface-xs opacity-60'
          : 'border-theme bg-surface hover:border-theme-md hover:bg-surface-md',
        isDraggable && 'cursor-default'
      )}
    >
      {/* Drag handle */}
      {isDraggable && (
        <div className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 c-faint" />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={() => toggleTaskStatus(task)}
        className={cn(
          'mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
          isDone
            ? 'bg-indigo-600 border-indigo-600'
            : 'border-theme-md hover:border-indigo-400'
        )}
      >
        {isDone && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn('flex items-start justify-between gap-2', task.description && 'cursor-pointer')}
          onClick={() => task.description && setDescExpanded((v) => !v)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className={cn(
                'text-sm font-medium leading-5',
                isDone ? 'line-through c-faint' : 'c-text'
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <AlignLeft className={cn('h-3.5 w-3.5 flex-shrink-0 transition-colors', descExpanded ? 'text-indigo-400' : 'c-faint')} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {task.description && descExpanded && (
          <div className="mt-2">
            <DescriptionRenderer text={task.description} />
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <Paperclip className="h-3 w-3 c-faint flex-shrink-0" />
            {task.attachments.map((att, i) => (
              <AttachmentChip key={i} att={att} />
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center flex-wrap gap-2">
          {task.company && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
              style={{
                backgroundColor: task.company.color,
              }}
            >
              <Building2 className="h-3 w-3" />
              {task.company.abbreviation}
            </span>
          )}

          {dueInfo && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                dueInfo.urgent ? 'text-red-400' : 'c-subtle'
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {dueInfo.label}
            </span>
          )}

          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs border',
              priorityColors[task.priority]
            )}
          >
            {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
          </span>
        </div>
      </div>
    </div>
  );
}
