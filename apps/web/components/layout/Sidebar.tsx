'use client';

import { useState } from 'react';
import { LayoutDashboard, CalendarDays, Settings, Building2, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore, type DateFilter } from '@/store/useTaskStore';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { activeDateFilter, setActiveDateFilter, activeCategory, setActiveCategory, tasks } = useTaskStore();

  const todayCount = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    const d = new Date(t.due_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const navItems = [
    { id: 'tasks', icon: LayoutDashboard, label: 'Aufgaben' },
    { id: 'timeline', icon: CalendarDays, label: 'Zeitleiste' },
    { id: 'settings', icon: Settings, label: 'Einstellungen' },
  ];

  const dateFilters: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Heute' },
    { value: 'week', label: 'Diese Woche' },
    { value: 'month', label: 'Dieser Monat' },
    { value: 'all', label: 'Alle' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/5 bg-white/[0.02] h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">TaskFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
              activePage === item.id
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.id === 'tasks' && todayCount > 0 && (
              <span className="ml-auto bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {todayCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Date filter section */}
      {activePage === 'tasks' && (
        <div className="px-3 mt-6">
          <p className="px-3 text-xs font-semibold text-white/25 uppercase tracking-wider mb-2">
            Zeitraum
          </p>
          {dateFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveDateFilter(f.value)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all',
                activeDateFilter === f.value
                  ? 'text-white font-medium'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {f.label}
              {activeDateFilter === f.value && (
                <ChevronRight className="h-3 w-3 text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Category section */}
      {activePage === 'tasks' && (
        <div className="px-3 mt-4">
          <p className="px-3 text-xs font-semibold text-white/25 uppercase tracking-wider mb-2">
            Kategorie
          </p>
          {[
            { value: 'all' as const, icon: LayoutDashboard, label: 'Alle' },
            { value: 'work' as const, icon: Building2, label: 'Firma' },
            { value: 'private' as const, icon: User, label: 'Privat' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                activeCategory === cat.value
                  ? 'text-white font-medium'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom spacer */}
      <div className="flex-1" />
    </aside>
  );
}
