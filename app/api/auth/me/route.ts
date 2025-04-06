import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/utils/serverAuth";
import { Task } from "@/app/utils/types";
import { secureLog, logError } from "@/app/utils/logger";

// タスクの重複を排除する関数
function removeDuplicateTasks(tasks: Task[]): Task[] {
  if (!tasks || !Array.isArray(tasks)) return [];

  // IDをキーとするMapを使用して重複を排除
  const uniqueTasksMap = new Map<string, Task>();
  let duplicatesFound = 0;

  tasks.forEach((task) => {
    if (task && task.id) {
      if (uniqueTasksMap.has(task.id)) {
        duplicatesFound++;
      }
      uniqueTasksMap.set(task.id, task);
    }
  });

  if (duplicatesFound > 0) {
    secureLog("タスクデータの重複を排除しました", "warn");
  }

  return Array.from(uniqueTasksMap.values());
}

// タスクデータを正規化する関数
function normalizeTaskData(tasks: Task[]): Task[] {
  if (!tasks || !Array.isArray(tasks)) return [];

  return tasks.map((task) => {
    // 日付データの正規化
    let createdAt = task.createdAt;
    if (typeof createdAt === "string") {
      createdAt = new Date(createdAt);
    } else if (!(createdAt instanceof Date)) {
      createdAt = new Date();
    }

    let dueDate = task.dueDate;
    if (typeof dueDate === "string") {
      dueDate = new Date(dueDate);
    } else if (dueDate && !(dueDate instanceof Date)) {
      dueDate = null;
    }

    // 完了状態を確実にブール値に
    const completed = Boolean(task.completed);

    return {
      ...task,
      createdAt,
      dueDate,
      completed,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    // JWT トークンからユーザー情報を取得
    const user = await getUserFromRequest(req);
    secureLog("ユーザー情報API呼び出し", "info");

    if (!user) {
      secureLog("未認証のユーザー情報リクエスト", "warn");
      return NextResponse.json(
        {
          success: false,
          message: "認証されていません",
        },
        { status: 401 }
      );
    }

    // タスクデータがある場合、重複チェックと排除を行う
    if (user.tasks && Array.isArray(user.tasks)) {
      const originalCount = user.tasks.length;

      // 重複タスクを排除
      let uniqueTasks = removeDuplicateTasks(user.tasks);

      // タスクデータを正規化
      uniqueTasks = normalizeTaskData(uniqueTasks);

      // 正規化後のタスクを更新
      user.tasks = uniqueTasks;

      const newCount = uniqueTasks.length;
      if (originalCount !== newCount) {
        secureLog("タスクデータを最適化しました", "info");
      }

      // 完了タスク数を確認（デバッグ用）
      const completedCount = uniqueTasks.filter(
        (task) => task.completed
      ).length;
      secureLog("ユーザー情報取得完了", "info");
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    logError("ユーザー情報取得処理中にエラー", error);
    return NextResponse.json(
      {
        success: false,
        message: "サーバーエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
