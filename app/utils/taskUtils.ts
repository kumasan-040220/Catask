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
export function createTask(
  title: string,
  estimatedTime: number = 0,
  dueDate: Date | null = null
): Task {
  return {
    id: uuidv4(),
    title,
    completed: false,
    createdAt: new Date(),
    estimatedTime,
    dueDate,
  };
}

// 安全にタスクフィルタリングを行う関数 - プリミティブかつシンプルな実装
export const filterTasks = (
  tasks: Task[],
  filter: TaskFilter,
  debug = false
): Task[] => {
  if (!tasks || !Array.isArray(tasks)) {
    console.warn("filterTasks: タスクが無効です", tasks);
    return [];
  }

  const validTasks = tasks.filter((task) => task && typeof task === "object");

  if (validTasks.length !== tasks.length) {
    console.warn(
      `filterTasks: ${
        tasks.length - validTasks.length
      }件の無効なタスクを除外しました`
    );
  }

  let result: Task[] = [];

  if (filter === TaskFilter.COMPLETED) {
    // 完了タスクの一覧表示用 - 厳密に完了状態を確認
    result = validTasks.filter((task) => {
      const isCompleted = task.completed === true;
      if (debug && isCompleted) {
        console.log(
          `完了タスク: ${task.id}, ${task.title}, 完了=${task.completed}`
        );
      }
      return isCompleted;
    });

    console.log(
      `filterTasks: ${result.length}件の完了タスクをフィルタリングしました`
    );
  } else if (filter === TaskFilter.ACTIVE) {
    // 未完了タスクの一覧表示用
    result = validTasks.filter((task) => task.completed !== true);
    console.log(
      `filterTasks: ${result.length}件の未完了タスクをフィルタリングしました`
    );
  } else {
    // すべてのタスク表示用
    result = [...validTasks];
    console.log(
      `filterTasks: フィルターなし - ${result.length}件のタスクを全て表示`
    );
  }

  return result;
};

// 安全にタスク並べ替えを行う関数
export function sortTasks(tasks: Task[]): Task[] {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  try {
    // createdAtプロパティの存在を確認し、日付順に並べ替え
    return [...tasks].sort((a, b) => {
      // createdAtがない場合は最後に表示
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;

      // Date型に変換して比較
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);

      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("sortTasks: タスクの並べ替え中にエラーが発生しました", error);
    return tasks; // エラー時は元のタスクリストをそのまま返す
  }
}

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

// 完了タスクのみを取得する関数（アーカイブタブ用）
export function getCompletedTasks(tasks: Task[]): Task[] {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  try {
    // completed === true のタスクのみを厳密に抽出
    const completedTasks = tasks.filter((task) => {
      // オブジェクトの存在確認
      if (!task) return false;

      // completedプロパティが明示的にtrueのものだけを抽出
      return task.completed === true;
    });

    // 結果をログ出力
    console.log(
      `getCompletedTasks: ${completedTasks.length}件の完了タスクを抽出しました`
    );
    if (completedTasks.length > 0) {
      completedTasks.forEach((task, index) => {
        console.log(
          `完了タスク[${index}]: ID=${task.id}, タイトル=${task.title}, 完了=${task.completed}`
        );
      });
    }

    return completedTasks;
  } catch (error) {
    console.error("getCompletedTasks: エラーが発生しました", error);
    return [];
  }
}

// アクティブタスクのみを取得する関数（アクティブタブ用）
export function getActiveTasks(tasks: Task[]): Task[] {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  try {
    // completed !== true のタスクのみを厳密に抽出
    return tasks.filter((task) => {
      // オブジェクトの存在確認
      if (!task) return false;

      // completedプロパティがtrueでないものだけを抽出
      return task.completed !== true;
    });
  } catch (error) {
    console.error("getActiveTasks: エラーが発生しました", error);
    return [];
  }
}
