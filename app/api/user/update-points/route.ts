import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, saveUser } from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // リクエストからユーザーを取得
    const user = await getUserFromRequest(req);
    console.log(
      "ポイント更新リクエスト - ユーザー:",
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

    // リクエストボディからポイントを取得
    const { points } = await req.json();
    console.log("受け取ったポイント:", points);

    if (points === undefined || typeof points !== "number" || points < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "有効なポイント値が必要です",
        },
        { status: 400 }
      );
    }

    // ユーザーのポイントを更新
    user.points = points;

    // 更新したユーザーを保存
    await saveUser(user);
    console.log(
      "ユーザーのポイントを更新しました:",
      user.id,
      "ポイント:",
      points
    );

    return NextResponse.json({
      success: true,
      message: "ポイントが更新されました",
    });
  } catch (error) {
    console.error("ポイント更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
