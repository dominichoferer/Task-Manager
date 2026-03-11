'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskList } from '@/components/tasks/TaskList';
import { Timeline } from '@/components/timeline/Timeline';
import { SettingsPage } from '@/components/layout/SettingsPage';
import { useTaskStore } from '@/store/useTaskStore';
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

export default function HomePage() {
  const [activePage, setActivePage] = useState('tasks');
  const { fetchTasks, fetchCompanies, activeDateFilter, activeCategory } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    fetchCompanies();
  }, []);

  const pageTitle: Record<string, string> = {
    tasks: 'Aufgaben',
    timeline: 'Zeitleiste',
    settings: 'Einstellungen',
  };

  const filterLabel: Record<string, string> = {
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
    all: 'Alle',
  };

  const categoryLabel: Record<string, string> = {
    all: 'Alle',
    work: 'Firma',
    private: 'Privat',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 px-8 py-5 border-b border-white/5 bg-[#0d0d1a]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              {activePage === 'tasks' && <LayoutDashboard className="h-4 w-4 text-indigo-400" />}
              {activePage === 'timeline' && <CalendarDays className="h-4 w-4 text-indigo-400" />}
              {activePage === 'settings' && <Settings className="h-4 w-4 text-indigo-400" />}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-none">
                {pageTitle[activePage]}
              </h1>
              {activePage === 'tasks' && (
                <p className="text-xs text-white/30 mt-0.5">
                  {filterLabel[activeDateFilter]} · {categoryLabel[activeCategory]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="px-8 py-6">
          {activePage === 'tasks' && <TaskList />}
          {activePage === 'timeline' && <Timeline />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
