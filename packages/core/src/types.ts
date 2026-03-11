export type TaskStatus = 'open' | 'in-progress' | 'done';
export type TaskCategory = 'work' | 'private';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Company {
  id: string;
  name: string;
  abbreviation: string;
  color: string; // hex color e.g. #FF5733
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null; // ISO string
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  company_id: string | null;
  user_id: string;
  created_at: string;
  company?: Company;
}

export interface TaskFilter {
  category?: TaskCategory;
  status?: TaskStatus;
  companyId?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
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

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateCompanyInput {
  name: string;
  abbreviation: string;
  color: string;
}
