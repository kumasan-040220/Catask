import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, saveUser } from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // リクエストからユーザーを取得
    const user = await getUserFromRequest(req);
    console.log(
      "タスク更新リクエスト - ユーザー:",
      user ? user.id : "認証なし"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "認証されていません",
        },
        { status: 401 }
      );
    }

    // リクエストボディからタスクリストを取得
    const body = await req.json();
    const { tasks } = body;
    console.log("受け取ったタスク数:", tasks ? tasks.length : 0);

    if (!tasks || !Array.isArray(tasks)) {
      console.log("タスクリストが無効:", body);
      return NextResponse.json(
        {
          success: false,
          message: "有効なタスクリストが必要です",
        },
        { status: 400 }
      );
    }

    // ユーザーのタスクを更新
    user.tasks = tasks;

    // 更新したユーザーを保存
    await saveUser(user);
    console.log(
      "ユーザーのタスクを更新しました:",
      user.id,
      "タスク数:",
      tasks.length
    );

    return NextResponse.json({
      success: true,
      message: "タスクが更新されました",
    });
  } catch (error) {
    console.error("タスク更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
