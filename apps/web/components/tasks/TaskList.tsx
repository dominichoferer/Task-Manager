'use client';

import { useState } from 'react';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useTaskStore, type Task } from '@/store/useTaskStore';

export function TaskList() {
  const { getFilteredTasks, loading, reorderTasks } = useTaskStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const tasks = getFilteredTasks();
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm c-muted">
          {openTasks.length} offen · {doneTasks.length} erledigt
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Aufgabe</DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {openTasks.length === 0 && doneTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 c-faint" />
          </div>
          <p className="c-muted text-sm">Keine Aufgaben vorhanden</p>
          <p className="c-faint text-xs mt-1">Erstelle deine erste Aufgabe</p>
        </div>
      )}

      {/* Open tasks with reorder arrows */}
      <div className="space-y-2">
        {openTasks.map((task, index) => (
          <div key={task.id} className="flex items-center gap-1">
            {/* Up / Down buttons */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => reorderTasks(index, index - 1)}
                disabled={index === 0}
                className="h-6 w-6 flex items-center justify-center rounded text-xs c-faint hover:c-text hover:bg-surface-md transition-all disabled:opacity-0"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => reorderTasks(index, index + 1)}
                disabled={index === openTasks.length - 1}
                className="h-6 w-6 flex items-center justify-center rounded text-xs c-faint hover:c-text hover:bg-surface-md transition-all disabled:opacity-0"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <TaskCard task={task} onEdit={(t) => setEditTask(t)} />
            </div>
          </div>
        ))}
      </div>

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium c-faint uppercase tracking-wider">Erledigt</p>
          {doneTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={(t) => setEditTask(t)} />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          {editTask && (
            <TaskForm editTask={editTask} onSuccess={() => setEditTask(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
