"use client";

import React, { useEffect, useMemo } from "react";
import Task from "./Task";
import {
  filterTasks,
  sortTasks,
  getCompletedTasks,
  getActiveTasks,
} from "../utils/taskUtils";
import { Task as TaskType, TaskFilter } from "../utils/types";

interface TaskListProps {
  tasks: TaskType[];
  filter: TaskFilter;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

// 重複タスクをチェックするためのヘルパー関数
const checkForDuplicates = (tasks: TaskType[]): void => {
  const taskIds = new Map<string, number>();
  let duplicatesFound = false;

  tasks.forEach((task) => {
    if (!taskIds.has(task.id)) {
      taskIds.set(task.id, 1);
    } else {
      const count = taskIds.get(task.id) || 0;
      taskIds.set(task.id, count + 1);
      duplicatesFound = true;
    }
  });

  if (duplicatesFound) {
    console.warn("⚠️ TaskList: 重複するタスクIDが見つかりました");
    taskIds.forEach((count, id) => {
      if (count > 1) {
        // 重複タスクの詳細情報を表示
        const duplicateTasks = tasks.filter((task) => task.id === id);
        console.warn(`- ID: ${id} が ${count} 回出現`);
        duplicateTasks.forEach((task, index) => {
          console.warn(
            `  ${index + 1}. タイトル: ${task.title}, 完了状態: ${
              task.completed
            }, 作成日: ${task.createdAt}`
          );
        });
      }
    });
  }
};

// フィルターによるタスクのフィルタリング（直接実装）
const filterTasksByStatus = (
  tasks: TaskType[],
  filter: TaskFilter
): TaskType[] => {
  if (!tasks || !Array.isArray(tasks)) return [];

  // フィルタリング処理を直接実装
  switch (filter) {
    case TaskFilter.ACTIVE:
      return tasks.filter((task) => !task.completed);
    case TaskFilter.COMPLETED:
      return tasks.filter((task) => task.completed);
    case TaskFilter.ALL:
    default:
      return [...tasks];
  }
};

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filter,
  onToggle,
  onDelete,
}) => {
  useEffect(() => {
    // タスクリストの整合性チェック
    if (tasks && tasks.length > 0) {
      checkForDuplicates(tasks);
      console.log(`TaskList: ${tasks.length} 件のタスクを処理中`);
    }
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    let filtered: TaskType[] = [];

    // フィルタによって異なる処理
    if (filter === TaskFilter.ACTIVE) {
      // 未完了タスクのみをフィルタリング
      filtered = tasks.filter((task) => !task.completed);
      console.log(`表示する未完了タスク: ${filtered.length}件`);
    } else if (filter === TaskFilter.COMPLETED) {
      // 完了タスク - ユーザーの要求により、完了タスクは表示しない
      console.log("完了タスクは表示しません");
      filtered = [];
    } else {
      // すべてのタスク - 完了タスクは除外
      filtered = tasks.filter((task) => !task.completed);
      console.log(`表示するタスク: ${filtered.length}件（完了タスクは除外）`);
    }

    // 各タスクの完了状態を確認（デバッグ用）
    const activeCount = tasks.filter((t) => !t.completed).length;
    const completedCount = tasks.filter((t) => t.completed).length;
    console.log(
      `未完了タスク: ${activeCount}件, 完了タスク: ${completedCount}件（非表示）`
    );

    // 並べ替え処理
    return sortTasks(filtered);
  }, [tasks, filter]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-3 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <div className="text-sm">空のタスクリスト</div>
      </div>
    );
  }

  if (filteredAndSortedTasks.length === 0) {
    if (filter === TaskFilter.ACTIVE) {
      return (
        <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-3 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm">未完了タスクはありません</div>
        </div>
      );
    } else if (filter === TaskFilter.COMPLETED) {
      return (
        <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-3 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4"
            />
          </svg>
          <div className="text-sm">完了タスクはありません</div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-2">
      {filteredAndSortedTasks.map((task) => (
        <Task
          key={task.id}
          task={task}
          onToggle={() => onToggle(task.id)}
          onDelete={() => onDelete && onDelete(task.id)}
        />
      ))}
    </div>
  );
};

export default TaskList;
