'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskList } from '@/components/tasks/TaskList';
import { Timeline } from '@/components/timeline/Timeline';
import { SettingsPage } from '@/components/layout/SettingsPage';
import { NotesPage } from '@/components/notes/NotesPage';
import { QuickNoteModal } from '@/components/notes/QuickNoteModal';
import { useTaskStore, getSavedTheme } from '@/store/useTaskStore';
import { LayoutDashboard, CalendarDays, Settings, NotebookPen, Loader2, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// ─── Auth Screen ────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    try {
      const { data, error: authError } = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (authError) { setError(authError.message); return; }
      if (data.user) onLogin(data.user);
      else setError('Bitte E-Mail bestätigen, dann einloggen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold c-text">TaskFlow</span>
        </div>

        <div className="bg-surface border border-theme rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold c-text mb-4">
            {mode === 'login' ? 'Einloggen' : 'Konto erstellen'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              required
              className="w-full h-10 px-3 rounded-lg text-sm bg-input border border-theme c-text placeholder:c-faint focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              required
              className="w-full h-10 px-3 rounded-lg text-sm bg-input border border-theme c-text placeholder:c-faint focus:outline-none focus:border-indigo-500 transition-colors"
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Einloggen' : 'Registrieren'}
            </button>
          </form>

          <p className="text-xs c-muted text-center mt-4">
            {mode === 'login' ? 'Noch kein Konto?' : 'Bereits registriert?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {mode === 'login' ? 'Registrieren' : 'Einloggen'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [activePage, setActivePage] = useState('tasks');
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const { fetchTasks, fetchCompanies, activeDateFilter, activeCategory, setTheme } = useTaskStore();

  useEffect(() => {
    const supabase = createClient();
    // Check current session
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCompanies();
      const saved = getSavedTheme();
      setTheme(saved);
    }
  }, [user]);

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Not logged in
  if (user === null) {
    return <AuthScreen onLogin={setUser} />;
  }

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
      <div className="hidden md:flex">
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          onQuickNote={() => setQuickNoteOpen(true)}
        />
      </div>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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

        <div className="px-4 md:px-8 py-4 md:py-6">
          {activePage === 'tasks' && <TaskList />}
          {activePage === 'timeline' && <Timeline />}
          {activePage === 'notes' && <NotesPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </main>

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

      <QuickNoteModal
        open={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        onSaved={fetchTasks}
      />
    </div>
  );
}
