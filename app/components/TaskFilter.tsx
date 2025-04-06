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
  const filters = [
    { value: FilterType.ACTIVE, label: "Active", count: taskCount.active },
    {
      value: FilterType.COMPLETED,
      label: "Archive",
      count: taskCount.completed,
    },
    { value: FilterType.ALL, label: "ALL", count: taskCount.all },
  ];

  return (
    <div className="flex w-full mb-4">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`flex-1 px-4 py-2 mx-1 first:ml-0 last:mr-0 rounded-full text-sm font-medium flex items-center justify-center ${
            currentFilter === filter.value
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-pressed={currentFilter === filter.value}
          aria-label={`${filter.label}のタスクを表示`}
        >
          {filter.label}
          <span className="ml-1 text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
