'use client';

import { useState } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Trash2, Pencil, CalendarDays, Building2, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task, TaskAttachment } from '@/store/useTaskStore';
import { useTaskStore } from '@/store/useTaskStore';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

function formatDueDate(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr);
  if (isToday(date)) return { label: 'Heute', urgent: true };
  if (isTomorrow(date)) return { label: 'Morgen', urgent: false };
  if (isPast(date)) return { label: format(date, 'dd.MM.yyyy', { locale: de }), urgent: true };
  return { label: format(date, 'dd.MM.yyyy', { locale: de }), urgent: false };
}

const priorityColors = {
  high: 'bg-red-500/20 border-red-500/40 text-red-300',
  medium: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  low: 'bg-green-500/20 border-green-500/40 text-green-300',
};

function DescriptionRenderer({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const hasBullets = lines.some((l) => l.startsWith('- '));

  if (!hasBullets) {
    return <p className="text-xs text-white/40 line-clamp-3">{text}</p>;
  }

  return (
    <ul className="space-y-0.5">
      {lines.map((line, i) =>
        line.startsWith('- ') ? (
          <li key={i} className="flex items-start gap-1.5 text-xs text-white/40">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/25 flex-shrink-0" />
            <span>{line.slice(2)}</span>
          </li>
        ) : (
          <li key={i} className="text-xs text-white/40 pl-3">{line}</li>
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
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-all max-w-[140px]"
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

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toggleTaskStatus, deleteTask } = useTaskStore();
  const [deleting, setDeleting] = useState(false);

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
          ? 'border-white/5 bg-white/2 opacity-60'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleTaskStatus(task)}
        className={cn(
          'mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
          isDone
            ? 'bg-indigo-600 border-indigo-600'
            : 'border-white/30 hover:border-indigo-400'
        )}
      >
        {isDone && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-sm font-medium leading-5',
              isDone ? 'line-through text-white/30' : 'text-white'
            )}
          >
            {task.title}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:text-red-400"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {task.description && (
          <div className="mt-1">
            <DescriptionRenderer text={task.description} />
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <Paperclip className="h-3 w-3 text-white/25 flex-shrink-0" />
            {task.attachments.map((att, i) => (
              <AttachmentChip key={i} att={att} />
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center flex-wrap gap-2">
          {/* Company badge */}
          {task.company && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: task.company.color + '25',
                border: `1px solid ${task.company.color}50`,
                color: task.company.color,
              }}
            >
              <Building2 className="h-3 w-3" />
              {task.company.abbreviation}
            </span>
          )}

          {/* Due date */}
          {dueInfo && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                dueInfo.urgent ? 'text-red-400' : 'text-white/40'
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {dueInfo.label}
            </span>
          )}

          {/* Priority */}
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
