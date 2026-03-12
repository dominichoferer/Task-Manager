'use client';

import { useMemo, useState } from 'react';
import {
  format, addDays, isToday, isSameDay, isPast, startOfDay,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays, AlertCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore, type Task } from '@/store/useTaskStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Period = '7' | '14' | '30' | '90';

const PERIODS: { label: string; value: Period; days: number }[] = [
  { label: 'Woche', value: '7', days: 7 },
  { label: '2 Wochen', value: '14', days: 14 },
  { label: 'Monat', value: '30', days: 30 },
  { label: 'Quartal', value: '90', days: 90 },
];

// ─── Task Detail Modal ────────────────────────────────────────
function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { toggleTaskStatus } = useTaskStore();
  const isDone = task.status === 'done';

  const priorityLabels = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };
  const priorityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={cn('pr-8', isDone && 'line-through c-faint')}>
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Status toggle */}
          <button
            onClick={() => toggleTaskStatus(task).then(onClose)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full',
              isDone
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-theme bg-surface c-muted hover:border-indigo-500/40 hover:text-indigo-300'
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isDone ? 'Als offen markieren' : 'Als erledigt markieren'}
          </button>

          {/* Meta info */}
          <div className="space-y-2">
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 c-faint flex-shrink-0" />
                <span className="c-muted">
                  {task.start_date && !isSameDay(new Date(task.start_date), new Date(task.due_date))
                    ? `${format(new Date(task.start_date), 'dd.MM.', { locale: de })} – ${format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}`
                    : format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })
                  }
                </span>
              </div>
            )}

            {task.company && (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: task.company.color }}
                >
                  {task.company.abbreviation}
                </span>
                <span className="c-muted">{task.company.name}</span>
              </div>
            )}

            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs border',
              priorityColors[task.priority]
            )}>
              {priorityLabels[task.priority]}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="rounded-lg bg-surface border border-theme p-3">
              <p className="text-xs c-muted whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Month Grid Calendar ──────────────────────────────────────
function MonthCalendar({ tasks, showDone }: { tasks: Task[]; showDone: boolean }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const visibleTasks = tasks.filter((t) => showDone || t.status !== 'done');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  function getTasksForDay(day: Date) {
    return visibleTasks.filter((t) => {
      if (!t.due_date) return false;
      const due = startOfDay(new Date(t.due_date));
      const start = t.start_date ? startOfDay(new Date(t.start_date)) : due;
      const dayStart = startOfDay(day);
      return dayStart >= start && dayStart <= due;
    });
  }

  const weekDayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg border border-theme hover:bg-surface transition-colors c-muted hover:c-text"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold c-text">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </span>
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg border border-theme hover:bg-surface transition-colors c-muted hover:c-text"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDayLabels.map((d) => (
          <div key={d} className="text-center text-xs font-medium c-faint py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const hasOverdue = dayTasks.some(
            (t) => t.status !== 'done' && isPast(day) && !isToday(day)
          );

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] rounded-lg p-1.5 border transition-all',
                isCurrentDay
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : hasOverdue
                  ? 'border-red-500/20 bg-red-500/5'
                  : isCurrentMonth
                  ? 'border-theme bg-surface'
                  : 'border-transparent bg-transparent'
              )}
            >
              <p className={cn(
                'text-xs font-medium mb-1 text-right',
                isCurrentDay
                  ? 'text-indigo-400'
                  : isCurrentMonth
                  ? hasOverdue ? 'text-red-400' : 'c-subtle'
                  : 'c-faint opacity-40'
              )}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const isStartDay = task.start_date
                    ? isSameDay(new Date(task.start_date), day)
                    : isSameDay(new Date(task.due_date!), day);
                  const isEndDay = isSameDay(new Date(task.due_date!), day);
                  const isSpanDay = !isStartDay && !isEndDay;

                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      title={task.title}
                      className={cn(
                        'w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded transition-all truncate',
                        task.status === 'done'
                          ? 'line-through opacity-50'
                          : '',
                        task.company
                          ? 'font-medium text-white'
                          : 'bg-indigo-600/60 hover:bg-indigo-600/80 text-white',
                        isSpanDay && 'rounded-none'
                      )}
                      style={task.company ? {
                        backgroundColor: task.company.color + 'aa',
                      } : undefined}
                    >
                      {isSpanDay ? '·' : task.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] c-faint text-center">+{dayTasks.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

// ─── Horizontal Scroll View ───────────────────────────────────
function ScrollView({ tasks, period, showDone, onTaskClick }: {
  tasks: Task[];
  period: Period;
  showDone: boolean;
  onTaskClick: (task: Task) => void;
}) {
  const days = useMemo(() => {
    const numDays = PERIODS.find((p) => p.value === period)!.days;
    return Array.from({ length: numDays }, (_, i) => addDays(new Date(), i));
  }, [period]);

  const tasksWithDates = tasks.filter((t) => t.due_date && (showDone || t.status !== 'done'));

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {days.map((day) => {
            const dayTasks = tasksWithDates.filter((t) => {
              const due = startOfDay(new Date(t.due_date!));
              const start = t.start_date ? startOfDay(new Date(t.start_date)) : due;
              const dayStart = startOfDay(day);
              return dayStart >= start && dayStart <= due;
            });
            const hasOverdue = dayTasks.some((t) => t.status !== 'done' && isPast(day) && !isToday(day));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex flex-col gap-2 flex-shrink-0 rounded-xl p-3 border transition-all',
                  period === '90' ? 'w-32' : period === '30' ? 'w-40' : 'w-48',
                  isToday(day)
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : hasOverdue
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-theme bg-surface'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn(
                      'text-xs font-semibold uppercase tracking-wider',
                      isToday(day) ? 'text-indigo-400' : hasOverdue ? 'text-red-400' : 'c-muted'
                    )}>
                      {format(day, 'EEE', { locale: de })}
                    </p>
                    <p className={cn(
                      'text-2xl font-bold leading-none',
                      isToday(day) ? 'c-text' : 'c-subtle'
                    )}>
                      {format(day, 'd')}
                    </p>
                    <p className="text-xs c-faint">{format(day, 'MMM', { locale: de })}</p>
                  </div>
                  {dayTasks.length > 0 && (
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      hasOverdue ? 'bg-red-500' : 'bg-indigo-600'
                    )}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {dayTasks.length === 0 ? (
                    <div className="h-8 flex items-center justify-center">
                      <div className="w-full h-px border-t border-theme" />
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={cn(
                          'w-full text-left rounded-lg p-2 border transition-all hover:border-indigo-500/40',
                          task.status === 'done'
                            ? 'bg-surface border-theme opacity-50'
                            : 'bg-surface-md border-theme hover:bg-surface'
                        )}
                      >
                        <p className={cn(
                          'text-xs font-medium leading-4',
                          period === '90' ? 'line-clamp-1' : 'line-clamp-2',
                          task.status === 'done' ? 'line-through c-faint' : 'c-text'
                        )}>
                          {task.title}
                        </p>
                        {task.company && period !== '90' && (
                          <span
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: task.company.color + '20',
                              color: task.company.color,
                            }}
                          >
                            {task.company.abbreviation}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Timeline/Kalender Component ────────────────────────
export function Timeline() {
  const { tasks } = useTaskStore();
  const [period, setPeriod] = useState<Period>('14');
  const [showDone, setShowDone] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const numDays = PERIODS.find((p) => p.value === period)!.days;
    return Array.from({ length: numDays }, (_, i) => addDays(new Date(), i));
  }, [period]);

  const periodEnd = days[days.length - 1];

  const overdue = tasks.filter(
    (t) => t.due_date && t.status !== 'done' && isPast(startOfDay(new Date(t.due_date))) && !isToday(new Date(t.due_date))
  ).length;

  const inPeriod = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = startOfDay(new Date(t.due_date));
    return d >= today && d <= periodEnd;
  });

  const openInPeriod = inPeriod.filter((t) => t.status !== 'done').length;
  const doneInPeriod = inPeriod.filter((t) => t.status === 'done').length;

  const isMonthView = period === '30';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold c-text flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-400" />
          Kalender
        </h2>

        <div className="flex items-center gap-2">
          {/* Show done toggle */}
          <button
            onClick={() => setShowDone((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all',
              showDone
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                : 'border-theme bg-surface c-faint hover:c-muted'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Erledigt
          </button>

          {/* Period filter */}
          <div className="flex items-center rounded-lg border border-theme bg-surface overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1 text-xs transition-all',
                  period === p.value
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'c-muted hover:c-text hover:bg-surface-md'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Clock className="h-4 w-4 text-indigo-400" />}
          label="Offen im Zeitraum"
          value={openInPeriod}
          color="text-indigo-400"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
          label="Erledigt im Zeitraum"
          value={doneInPeriod}
          color="text-green-400"
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4 text-red-400" />}
          label="Überfällig"
          value={overdue}
          color="text-red-400"
          highlight={overdue > 0}
        />
      </div>

      {/* Month grid or scroll view */}
      {isMonthView ? (
        <MonthCalendar tasks={tasks} showDone={showDone} />
      ) : (
        <ScrollView
          tasks={tasks}
          period={period}
          showDone={showDone}
          onTaskClick={setSelectedTask}
        />
      )}

      {/* Task detail modal for scroll view */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl border p-3 bg-surface',
      highlight ? 'border-red-500/30 bg-red-500/5' : 'border-theme'
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs c-muted">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  );
}
