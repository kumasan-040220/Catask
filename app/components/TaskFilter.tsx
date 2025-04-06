"use client";

import { TaskFilter as FilterType } from "../utils/types";

interface TaskFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  taskCount: {
    all: number;
    active: number;
    completed: number;
  };
}

export default function TaskFilterComponent({
  currentFilter,
  onFilterChange,
  taskCount,
}: TaskFilterProps) {
  // フィルターボタン用の設定
  const filterButtons = [
    { filter: FilterType.ACTIVE, label: "未完了", count: taskCount.active },
    {
      filter: FilterType.COMPLETED,
      label: "完了済み",
      count: taskCount.completed,
    },
  ];

  return (
    <div className="flex mb-4 bg-white rounded-lg overflow-hidden shadow-sm">
      {filterButtons.map((btn) => (
        <button
          key={btn.filter}
          className={`flex-1 py-2 px-3 text-sm ${
            currentFilter === btn.filter
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => onFilterChange(btn.filter)}
        >
          {btn.label} ({btn.count})
        </button>
      ))}
    </div>
  );
}
