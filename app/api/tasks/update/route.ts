import { getUserFromRequest, saveUser } from "@/app/utils/serverAuth";
import { NextRequest, NextResponse } from "next/server";
import { Task } from "@/app/utils/types";
import { ObjectId } from "mongodb";
import {
  decryptTaskData,
  encryptTaskData,
  migrateEncryptedTasks,
} from "@/app/utils/mongodb";

// タスクの重複を削除する関数
function removeDuplicateTasks(tasks: Task[]): Task[] {
  const uniqueTasks: Task[] = [];
  const taskIds = new Set<string>();

  for (const task of tasks) {
    if (!taskIds.has(task.id)) {
      taskIds.add(task.id);
      uniqueTasks.push(task);
    }
  }

  return uniqueTasks;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("[" + new Date().toISOString() + "] タスク更新API呼び出し");

    // リクエストからユーザー情報を取得
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log(
        "[" + new Date().toISOString() + "] ユーザーが見つかりません"
      );
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    // リクエストボディからタスクデータを取得
    const { tasks } = await req.json();
    if (!tasks || !Array.isArray(tasks)) {
      console.error(
        `[${new Date().toISOString()}] 無効なタスクデータを受信しました`
      );
      return NextResponse.json(
        { error: "無効なタスクデータです" },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] 受信タスク数: ${tasks.length}`);

    // 重複タスクの除去
    const uniqueTasks = removeDuplicateTasks(tasks);
    if (uniqueTasks.length !== tasks.length) {
      console.log(
        `[${new Date().toISOString()}] ${
          tasks.length - uniqueTasks.length
        }件の重複タスクを除去しました`
      );
    }

    // タスクの復号化（暗号化されたタスクがある場合は平文に変換）
    const processedTasks = decryptTaskData(uniqueTasks);

    // 復号化できないタイトルの修正
    const fixedTasks = processedTasks.map((task) => {
      const newTask = { ...task };

      // 復号化できなかったタスクの処理
      if (
        newTask.title &&
        typeof newTask.title === "string" &&
        (newTask.title.startsWith("[復号化不可]") ||
          newTask.title.startsWith("[復号化エラー]"))
      ) {
        console.log(
          `[${new Date().toISOString()}] 復号化できないタスクを修正: ${
            newTask.id
          }`
        );
        newTask.title = `タスク ${newTask.id || "不明"}`;
        newTask.plainTitle = newTask.title;
      }

      return newTask;
    });

    // 完了済みのタスク数をカウント
    const completedTasks = fixedTasks.filter((task) => task.completed);
    console.log(
      `[${new Date().toISOString()}] 処理結果: 全${fixedTasks.length}件中${
        completedTasks.length
      }件完了`
    );

    // ユーザーのタスクを更新
    user.tasks = fixedTasks;

    // ユーザー情報を保存（暗号化は無効化されているため平文で保存される）
    await saveUser(user);

    console.log(`[${new Date().toISOString()}] タスク更新完了`);

    return NextResponse.json(
      { success: true, taskCount: fixedTasks.length },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] タスク更新中にエラーが発生しました:`,
      error
    );
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
