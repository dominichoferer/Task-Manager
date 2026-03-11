import type { SupabaseClient } from '@supabase/supabase-js';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from './types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  async getTasks(filter: TaskFilter = {}): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select('*, company:companies(*)')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.companyId) {
      query = query.eq('company_id', filter.companyId);
    }

    if (filter.dateRange && filter.dateRange !== 'all') {
      const now = new Date();
      let from: Date, to: Date;

      switch (filter.dateRange) {
        case 'today':
          from = startOfDay(now);
          to = endOfDay(now);
          break;
        case 'week':
          from = startOfWeek(now, { weekStartsOn: 1 });
          to = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          from = startOfMonth(now);
          to = endOfMonth(now);
          break;
      }

      query = query
        .gte('due_date', from!.toISOString())
        .lte('due_date', to!.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(input)
      .select('*, company:companies(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask({ id, ...input }: UpdateTaskInput): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleTaskStatus(task: Task): Promise<Task> {
    const nextStatus = task.status === 'done' ? 'open' : 'done';
    return this.updateTask({ id: task.id, status: nextStatus });
  }
}
