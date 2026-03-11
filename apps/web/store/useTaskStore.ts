import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export type TaskStatus = 'open' | 'in-progress' | 'done';
export type TaskCategory = 'work' | 'private';
export type TaskPriority = 'low' | 'medium' | 'high';
export type DateFilter = 'today' | 'week' | 'month' | 'all';

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
}

interface TaskStore {
  tasks: Task[];
  companies: Company[];
  activeCategory: TaskCategory | 'all';
  activeDateFilter: DateFilter;
  loading: boolean;
  error: string | null;

  setActiveCategory: (cat: TaskCategory | 'all') => void;
  setActiveDateFilter: (filter: DateFilter) => void;

  fetchTasks: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: Partial<CreateTaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (task: Task) => Promise<void>;

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

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  companies: [],
  activeCategory: 'all',
  activeDateFilter: 'all',
  loading: false,
  error: null,

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setActiveDateFilter: (filter) => set({ activeDateFilter: filter }),

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*, company:companies(*)')
        .order('due_date', { ascending: true });
      if (error) throw error;
      set({ tasks: data ?? [] });
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
      .insert({ ...input, user_id: user?.id })
      .select('*, company:companies(*)')
      .single();
    if (error) throw error;
    set((s) => ({ tasks: [data, ...s.tasks] }));
    return data;
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
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }));
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
