'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useTaskStore, type Task } from '@/store/useTaskStore';
import { cn } from '@/lib/utils';

export function TaskList() {
  const { getFilteredTasks, loading, reorderTasks } = useTaskStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Drag-and-drop state – both as useState so re-renders fire correctly
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const tasks = getFilteredTasks();
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  function handleDragStart(e: React.DragEvent, index: number) {
    // dataTransfer.setData is required by browsers to activate drag
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndex;
    if (from !== null && from !== index) {
      reorderTasks(from, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

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

      <div className="space-y-2">
        {openTasks.map((task, index) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'transition-opacity duration-100 rounded-xl',
              dragIndex === index && 'opacity-40',
              dragOverIndex === index && dragIndex !== index && 'ring-2 ring-indigo-500 ring-offset-1'
            )}
          >
            {/* Pointer-events:none on children prevents them from swallowing dragover events */}
            <div className={cn(dragIndex !== null && 'pointer-events-none')}>
              <TaskCard task={task} onEdit={(t) => setEditTask(t)} isDraggable />
            </div>
          </div>
        ))}
      </div>

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
