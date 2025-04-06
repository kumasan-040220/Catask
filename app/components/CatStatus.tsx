"use client";

import { useCatStatus } from "../providers/CatStatusProvider";
import { CatStatusType } from "../utils/types";

interface CatStatusProps {
  className?: string;
}

// ステータスタイプに応じた背景色マップ
const STATUS_COLORS = {
  [CatStatusType.NORMAL]: "bg-yellow-50",
  [CatStatusType.HAPPY]: "bg-green-50",
  [CatStatusType.HUNGRY]: "bg-orange-50",
  [CatStatusType.SLEEPY]: "bg-blue-50",
  [CatStatusType.PLAYFUL]: "bg-purple-50",
};

export default function CatStatus({ className = "" }: CatStatusProps) {
  const { statusType, statusLogs, catName, statusMessage } = useCatStatus();

  // statusLogsが空の場合はnullを返す
  if (!statusLogs || statusLogs.length === 0 || !statusMessage || !catName)
    return null;

  return (
    <div
      className={`${STATUS_COLORS[statusType]} p-6 rounded-lg shadow ${className} transition-colors duration-300 w-full`}
    >
      <h3 className="text-2xl font-bold mb-3 text-gray-700 text-center">
        {catName}の様子
      </h3>
      <div className="text-gray-800 text-2xl text-center p-4">
        <p>
          {catName}
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
