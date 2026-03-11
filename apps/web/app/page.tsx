'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskList } from '@/components/tasks/TaskList';
import { Timeline } from '@/components/timeline/Timeline';
import { SettingsPage } from '@/components/layout/SettingsPage';
import { NotesPage } from '@/components/notes/NotesPage';
import { QuickNoteModal } from '@/components/notes/QuickNoteModal';
import { useTaskStore, getSavedTheme } from '@/store/useTaskStore';
import { LayoutDashboard, CalendarDays, Settings, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [activePage, setActivePage] = useState('tasks');
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const { fetchTasks, fetchCompanies, activeDateFilter, activeCategory, setTheme } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    fetchCompanies();
    const saved = getSavedTheme();
    setTheme(saved);
  }, []);

  const pageTitle: Record<string, string> = {
    tasks: 'Aufgaben',
    timeline: 'Zeitleiste',
    notes: 'Notizen',
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

  const mobileNavItems = [
    { id: 'tasks', icon: LayoutDashboard, label: 'Aufgaben' },
    { id: 'timeline', icon: CalendarDays, label: 'Zeitleiste' },
    { id: 'notes', icon: NotebookPen, label: 'Notizen' },
    { id: 'settings', icon: Settings, label: 'Einstellungen' },
  ];

  const pageIcon: Record<string, React.ReactNode> = {
    tasks: <LayoutDashboard className="h-4 w-4 text-indigo-400" />,
    timeline: <CalendarDays className="h-4 w-4 text-indigo-400" />,
    notes: <NotebookPen className="h-4 w-4 text-indigo-400" />,
    settings: <Settings className="h-4 w-4 text-indigo-400" />,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          onQuickNote={() => setQuickNoteOpen(true)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 px-4 md:px-8 py-4 md:py-5 border-b border-theme backdrop-blur-sm"
          style={{ backgroundColor: 'var(--bg-topbar)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              {pageIcon[activePage]}
            </div>
            <div>
              <h1 className="text-lg font-semibold c-text leading-none">
                {pageTitle[activePage]}
              </h1>
              {activePage === 'tasks' && (
                <p className="text-xs c-subtle mt-0.5">
                  {filterLabel[activeDateFilter]} · {categoryLabel[activeCategory]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="px-4 md:px-8 py-4 md:py-6">
          {activePage === 'tasks' && <TaskList />}
          {activePage === 'timeline' && <Timeline />}
          {activePage === 'notes' && <NotesPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-theme backdrop-blur-md"
        style={{ backgroundColor: 'var(--bg-topbar)' }}
      >
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                activePage === item.id ? 'text-indigo-400' : 'c-subtle'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Quick Note Modal – global, accessible from anywhere */}
      <QuickNoteModal
        open={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        onSaved={fetchTasks}
      />
    </div>
  );
}
