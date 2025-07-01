"use client";

import { Trash2 } from "lucide-react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/60">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        aria-label={`Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
        className="size-5 rounded-[4px] border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cn(
          "flex-grow cursor-pointer text-base transition-all",
          task.completed && "text-muted-foreground line-through"
        )}
      >
        {task.text}
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete task ${task.text}`}
        className="h-8 w-8 shrink-0 rounded-full opacity-50 transition-opacity hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
