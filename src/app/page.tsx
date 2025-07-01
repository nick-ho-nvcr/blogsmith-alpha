"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTaskForm } from "@/components/AddTaskForm";
import { TaskItem } from "@/components/TaskItem";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Task } from "@/types";

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);

  const addTask = (taskText: string) => {
    const newTask: Task = {
      id: new Date().toISOString(),
      text: taskText,
      completed: false,
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [tasks]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-center text-2xl font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-accent"><path d="M20 6 9 17l-5-5"/></svg>
            Verdant Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AddTaskForm onAddTask={addTask} />
          
          <div className="space-y-2">
            {sortedTasks.length > 0 ? (
              sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            ) : (
              <p className="pt-4 text-center text-muted-foreground">
                No tasks yet. Add one to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
