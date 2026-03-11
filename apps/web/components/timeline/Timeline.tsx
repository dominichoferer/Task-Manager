'use client';

import { useMemo, useState } from 'react';
import { format, addDays, isToday, isSameDay, isPast, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';

type Period = '7' | '14' | '30' | '90';

const PERIODS: { label: string; value: Period; days: number }[] = [
  { label: 'Woche', value: '7', days: 7 },
  { label: '2 Wochen', value: '14', days: 14 },
  { label: 'Monat', value: '30', days: 30 },
  { label: 'Quartal', value: '90', days: 90 },
];

export function Timeline() {
  const { tasks } = useTaskStore();
  const [period, setPeriod] = useState<Period>('14');
  const [showDone, setShowDone] = useState(false);

  const days = useMemo(() => {
    const numDays = PERIODS.find((p) => p.value === period)!.days;
    return Array.from({ length: numDays }, (_, i) => addDays(new Date(), i));
  }, [period]);

  const tasksWithDates = tasks.filter((t) => t.due_date && (showDone || t.status !== 'done'));

  // Stats
  const today = startOfDay(new Date());
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold c-text flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-400" />
          Zeitleiste
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

      {/* Calendar scroll */}
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {days.map((day) => {
              const dayTasks = tasksWithDates.filter((t) =>
                isSameDay(new Date(t.due_date!), day)
              );
              const hasOverdue = dayTasks.some((t) => t.status !== 'done' && isPast(day) && !isToday(day));

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex flex-col gap-2 flex-shrink-0 rounded-xl p-3 border transition-all',
                    // Width shrinks for 30/90 day views
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
                        <div
                          key={task.id}
                          className={cn(
                            'rounded-lg p-2 border',
                            task.status === 'done'
                              ? 'bg-surface border-theme opacity-50'
                              : 'bg-surface-md border-theme'
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
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute top-[52px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--c-border-sm)] to-transparent pointer-events-none" />
      </div>
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
