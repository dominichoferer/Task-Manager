'use client';

import { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';

export function Timeline() {
  const { tasks } = useTaskStore();

  // Generate next 14 days
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  }, []);

  const tasksWithDates = tasks.filter((t) => t.due_date && t.status !== 'done');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-indigo-400" />
        Zeitleiste
      </h2>

      {/* Timeline track */}
      <div className="relative">
        {/* Horizontal scrollable area */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {days.map((day) => {
              const dayTasks = tasksWithDates.filter((t) =>
                isSameDay(new Date(t.due_date!), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex flex-col gap-2 w-48 flex-shrink-0 rounded-xl p-3 border transition-all',
                    isToday(day)
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/5 bg-white/3'
                  )}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          'text-xs font-semibold uppercase tracking-wider',
                          isToday(day) ? 'text-indigo-400' : 'text-white/40'
                        )}
                      >
                        {format(day, 'EEE', { locale: de })}
                      </p>
                      <p
                        className={cn(
                          'text-2xl font-bold leading-none',
                          isToday(day) ? 'text-white' : 'text-white/60'
                        )}
                      >
                        {format(day, 'd')}
                      </p>
                      <p className="text-xs text-white/30">{format(day, 'MMM', { locale: de })}</p>
                    </div>
                    {dayTasks.length > 0 && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks for this day */}
                  <div className="space-y-1.5">
                    {dayTasks.length === 0 ? (
                      <div className="h-8 flex items-center justify-center">
                        <div className="w-full h-px bg-white/5" />
                      </div>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg p-2 bg-white/5 border border-white/8"
                        >
                          <p className="text-xs text-white font-medium line-clamp-2 leading-4">
                            {task.title}
                          </p>
                          {task.company && (
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

        {/* Connecting line */}
        <div className="absolute top-[52px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
