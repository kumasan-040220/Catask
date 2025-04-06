"use client";

import { useState } from "react";
import {
  FaTrash,
  FaCheck,
  FaClock,
  FaCalendarAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { Task as TaskType } from "../utils/types";
import { formatRemainingTime, formatDueDateTime } from "../utils/taskUtils";

interface TaskProps {
  task: TaskType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Task({ task, onToggle, onDelete }: TaskProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 現在時刻と締め切り時刻の比較
  const isOverdue =
    task.dueDate && !task.completed && new Date() > task.dueDate;

  return (
    <div
      className={`flex flex-col p-4 mb-2 bg-white border rounded-lg shadow-sm ${
        isOverdue ? "border-red-400" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button
            onClick={() => onToggle(task.id)}
            className={`flex items-center justify-center w-6 h-6 rounded-full border mr-3 ${
              task.completed
                ? "bg-green-500 border-green-500"
                : "border-gray-400"
            }`}
            aria-label={
              task.completed ? "タスク完了を取り消す" : "タスクを完了する"
            }
          >
            {task.completed && <FaCheck className="text-white text-xs" />}
          </button>
          <div className="flex-1 flex flex-col">
            <span
              className={`${
                task.completed ? "line-through text-gray-500" : ""
              }`}
            >
              {task.title}
            </span>
            <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500">
              {task.estimatedTime > 0 && (
                <span className="flex items-center mr-3">
                  <FaClock className="mr-1" size={12} />
                  {task.estimatedTime}分
                </span>
              )}
              {task.dueDate && (
                <span
                  className={`flex items-center ${
                    isOverdue ? "text-red-500 font-medium" : ""
                  }`}
                >
                  <FaCalendarAlt className="mr-1" size={12} />
                  {isOverdue ? "期限切れ" : formatRemainingTime(task.dueDate)}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                    aria-label={showDetails ? "詳細を隠す" : "詳細を表示"}
                  >
                    <FaInfoCircle size={12} />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          aria-label="タスクを削除"
        >
          <FaTrash />
        </button>
      </div>

      {/* 締め切り日時の詳細表示 */}
      {showDetails && task.dueDate && (
        <div className="mt-2 pt-2 border-t text-sm text-gray-500">
          <p>締切日時: {formatDueDateTime(task.dueDate)}</p>
        </div>
      )}
    </div>
  );
}
