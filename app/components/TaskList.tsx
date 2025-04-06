"use client";

import { useMemo } from "react";
import Task from "./Task";
import { Task as TaskType, TaskFilter } from "../utils/types";
import { filterTasks, sortTasks } from "../utils/taskUtils";

interface TaskListProps {
  tasks: TaskType[];
  filter: TaskFilter;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({
  tasks,
  filter,
  onToggle,
  onDelete,
}: TaskListProps) {
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filter);
    return sortTasks(filtered);
  }, [tasks, filter]);

  if (filteredAndSortedTasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {filter === TaskFilter.ALL
          ? "タスクはありません。"
          : filter === TaskFilter.ACTIVE
          ? "タスクはありません。"
          : "タスクはありません。"}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {filteredAndSortedTasks.map((task) => (
        <Task
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
