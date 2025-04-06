import { v4 as uuidv4 } from "uuid";
import { Task, TaskFilter } from "./types";

// ローカルストレージからタスクを取得
export const getTasks = (): Task[] => {
  if (typeof window === "undefined") return [];

  const storedTasks = localStorage.getItem("tasks");
  if (!storedTasks) return [];

  try {
    const tasks = JSON.parse(storedTasks);
    return tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      // 既存のタスクにestimatedTimeがなければデフォルト値として0を設定
      estimatedTime: task.estimatedTime || 0,
      // 既存のタスクにdueDateがあれば日付オブジェクトに変換、なければnull
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    }));
  } catch (error) {
    console.error("タスクの取得に失敗しました", error);
    return [];
  }
};

// ローカルストレージにタスクを保存
export const saveTasks = (tasks: Task[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// 新しいタスクを作成
export const createTask = (
  title: string,
  estimatedTime: number = 0,
  dueDate: Date | null = null
): Task => {
  return {
    id: uuidv4(),
    title,
    completed: false,
    createdAt: new Date(),
    estimatedTime,
    dueDate,
  };
};

// タスクをフィルタリング
export const filterTasks = (tasks: Task[], filter: TaskFilter): Task[] => {
  switch (filter) {
    case TaskFilter.ACTIVE:
      return tasks.filter((task) => !task.completed);
    case TaskFilter.COMPLETED:
      return tasks.filter((task) => task.completed);
    case TaskFilter.ALL:
    default:
      return tasks;
  }
};

// タスクをソート（新しい順）
export const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};

// 日付をフォーマットする関数 (YYYY-MM-DD)
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// 時間をフォーマットする関数 (HH:MM)
export const formatTime = (date: Date): string => {
  return date.toTimeString().substring(0, 5);
};

// 日付と時間を結合してDateオブジェクトを作成する関数
export const createDateFromInputs = (
  dateStr: string,
  timeStr: string
): Date => {
  const date = new Date(`${dateStr}T${timeStr}`);
  return date;
};

// 締め切りまでの残り時間を表示用にフォーマットする関数
export const formatRemainingTime = (dueDate: Date): string => {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();

  // 既に期限切れの場合
  if (diffTime < 0) {
    return "期限切れ";
  }

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays > 0) {
    return `${diffDays}日${diffHours}時間`;
  } else if (diffHours > 0) {
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}時間${diffMinutes}分`;
  } else {
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return `${diffMinutes}分`;
  }
};

// 締め切り日時を「YYYY/MM/DD HH:MM」形式でフォーマットする関数
export const formatDueDateTime = (dueDate: Date): string => {
  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, "0");
  const day = String(dueDate.getDate()).padStart(2, "0");
  const hours = String(dueDate.getHours()).padStart(2, "0");
  const minutes = String(dueDate.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
};
