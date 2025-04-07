"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { createDateFromInputs } from "../utils/taskUtils";

interface TaskFormProps {
  onAdd: (title: string, estimatedTime: number, dueDate: Date | null) => void;
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim()) {
      // 所要時間が入力されていなければ0とする
      const time = estimatedTime ? parseInt(estimatedTime, 10) : 0;

      // 締め切り日時の処理
      let dueDateObj: Date | null = null;
      if (dueDate) {
        try {
          // 時間が入力されていない場合は23:59に設定
          const timeValue = dueTime || "23:59";
          dueDateObj = createDateFromInputs(dueDate, timeValue);
        } catch (error) {
          console.error("日付の変換に失敗しました", error);
        }
      }

      onAdd(title.trim(), time, dueDateObj);
      setTitle("");
      setEstimatedTime("");
      setDueDate("");
      setDueTime("");
    }
  };

  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col w-full rounded-lg border overflow-hidden shadow-sm">
        <div className="flex">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 p-3 outline-none"
            aria-label="タスク名"
          />
          <div className="flex items-center bg-gray-50 px-3">
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="所要時間"
              min="0"
              className="w-20 p-2 outline-none bg-gray-50 text-right"
              aria-label="所要時間（分）"
            />
            <span className="ml-1 text-gray-500">分</span>
          </div>
        </div>
        <div className="flex bg-gray-50 p-2 border-t items-center justify-between">
          <div className="flex-none w-4"></div>
          <div className="flex items-center justify-center flex-grow gap-8">
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              className="p-1 border rounded"
              aria-label="締切日"
            />
            <input
              id="due-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="p-1 border rounded"
              aria-label="締切時間"
              placeholder="23:59"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 flex items-center hover:bg-blue-600 transition-colors"
            disabled={!title.trim()}
            aria-label="タスクを追加"
          >
            <FaPlus className="mr-1" />
            <span>追加</span>
          </button>
        </div>
      </div>
    </form>
  );
}
