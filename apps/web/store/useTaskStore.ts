import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export type TaskStatus = 'open' | 'in-progress' | 'done';
export type TaskCategory = 'work' | 'private';
export type TaskPriority = 'low' | 'medium' | 'high';
export type DateFilter = 'today' | 'week' | 'month' | 'all';
export type Theme = 'nacht' | 'ozean' | 'vulkan' | 'wald' | 'tag' | 'sand';

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface QuickNote {
  id: string;
  content: string;
  task_id: string | null;
  user_id: string;
  created_at: string;
  task?: Task;
}

export interface Company {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  company_id: string | null;
  user_id: string;
  created_at: string;
  attachments: TaskAttachment[];
  company?: Company;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  company_id?: string;
  attachments?: TaskAttachment[];
}

interface TaskStore {
  tasks: Task[];
  companies: Company[];
  quickNotes: QuickNote[];
  activeCategory: TaskCategory | 'all';
  activeDateFilter: DateFilter;
  theme: Theme;
  loading: boolean;
  error: string | null;

  setActiveCategory: (cat: TaskCategory | 'all') => void;
  setActiveDateFilter: (filter: DateFilter) => void;
  setTheme: (theme: Theme) => void;

  fetchTasks: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: Partial<CreateTaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (task: Task) => Promise<void>;
  uploadAttachment: (taskId: string, file: File) => Promise<TaskAttachment>;

  fetchQuickNotes: () => Promise<void>;
  saveQuickNote: (content: string) => Promise<{ note: QuickNote; task: Task }>;
  saveQuickNoteOnly: (content: string) => Promise<QuickNote>;
  updateQuickNote: (id: string, content: string) => Promise<void>;
  convertNoteToTask: (noteId: string, content: string) => Promise<Task>;
  deleteQuickNote: (id: string) => Promise<void>;

  createCompany: (input: { name: string; abbreviation: string; color: string }) => Promise<void>;
  updateCompany: (id: string, input: { name?: string; abbreviation?: string; color?: string }) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  getFilteredTasks: () => Task[];
}

function getDateRange(filter: DateFilter): { from: Date; to: Date } | null {
  if (filter === 'all') return null;
  const now = new Date();

  if (filter === 'today') {
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    const to = new Date(now); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (filter === 'week') {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const from = new Date(now); from.setDate(now.getDate() + diff); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (filter === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
  return null;
}

function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'nacht';
  return (localStorage.getItem('theme') as Theme) || 'nacht';
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  companies: [],
  quickNotes: [],
  activeCategory: 'all',
  activeDateFilter: 'all',
  theme: 'nacht',
  loading: false,
  error: null,

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setActiveDateFilter: (filter) => set({ activeDateFilter: filter }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*, company:companies(*)')
        .order('due_date', { ascending: true });
      if (error) throw error;
      set({ tasks: (data ?? []).map((t) => ({ ...t, attachments: t.attachments ?? [] })) });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCompanies: async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) return;
    set({ companies: data ?? [] });
  },

  createTask: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, attachments: input.attachments ?? [], user_id: user?.id })
      .select('*, company:companies(*)')
      .single();
    if (error) throw error;
    const task = { ...data, attachments: data.attachments ?? [] };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  updateTask: async (id, input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single();
    if (error) throw error;
    const task = { ...data, attachments: data.attachments ?? [] };
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
  },

  deleteTask: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  toggleTaskStatus: async (task) => {
    const next = task.status === 'done' ? 'open' : 'done';
    await get().updateTask(task.id, { status: next });
  },

  uploadAttachment: async (taskId, file) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user?.id}/${taskId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(filePath);
    return { name: file.name, url: urlData.publicUrl, type: file.type, size: file.size };
  },

  fetchQuickNotes: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('quick_notes')
      .select('*, task:tasks(id,title,status)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return;
    set({ quickNotes: data ?? [] });
  },

  saveQuickNote: async (content) => {
    // 1. Parse with AI
    const res = await fetch('/api/ai/parse-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const parsed = await res.json();

    // 2. Create task
    const task = await get().createTask({
      title: parsed.title || content.slice(0, 60),
      description: parsed.description || undefined,
      status: 'open',
      category: 'work',
      priority: 'medium',
    });

    // 3. Save note with task reference
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('quick_notes')
      .insert({ content, task_id: task.id, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;

    const note: QuickNote = { ...data, task };
    set((s) => ({ quickNotes: [note, ...s.quickNotes] }));
    return { note, task };
  },

  saveQuickNoteOnly: async (content) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('quick_notes')
      .insert({ content, task_id: null, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    const note: QuickNote = { ...data };
    set((s) => ({ quickNotes: [note, ...s.quickNotes] }));
    return note;
  },

  convertNoteToTask: async (noteId, content) => {
    // Parse with AI
    const res = await fetch('/api/ai/parse-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const parsed = await res.json();

    // Create task
    const task = await get().createTask({
      title: parsed.title || content.slice(0, 60),
      description: parsed.description || undefined,
      status: 'open',
      category: 'work',
      priority: 'medium',
    });

    // Link note to task
    const supabase = createClient();
    await supabase.from('quick_notes').update({ task_id: task.id }).eq('id', noteId);
    set((s) => ({
      quickNotes: s.quickNotes.map((n) => (n.id === noteId ? { ...n, task_id: task.id, task } : n)),
    }));
    return task;
  },

  updateQuickNote: async (id, content) => {
    const supabase = createClient();
    const { error } = await supabase.from('quick_notes').update({ content }).eq('id', id);
    if (error) throw error;
    set((s) => ({
      quickNotes: s.quickNotes.map((n) => (n.id === id ? { ...n, content } : n)),
    }));
  },

  deleteQuickNote: async (id) => {
    const supabase = createClient();
    await supabase.from('quick_notes').delete().eq('id', id);
    set((s) => ({ quickNotes: s.quickNotes.filter((n) => n.id !== id) }));
  },

  createCompany: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('companies')
      .insert({ ...input, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ companies: [...s.companies, data] }));
  },

  updateCompany: async (id, input) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('companies')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ companies: s.companies.map((c) => (c.id === id ? data : c)) }));
  },

  deleteCompany: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    set((s) => ({ companies: s.companies.filter((c) => c.id !== id) }));
  },

  getFilteredTasks: () => {
    const { tasks, activeCategory, activeDateFilter } = get();
    let filtered = tasks;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }

    const range = getDateRange(activeDateFilter);
    if (range) {
      filtered = filtered.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= range.from && d <= range.to;
      });
    }

    return filtered;
  },
}));

export { getSavedTheme };
