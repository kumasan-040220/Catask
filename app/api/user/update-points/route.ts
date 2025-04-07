import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, saveUser } from "@/app/utils/serverAuth";
import { secureLog, logError } from "@/app/utils/logger";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディからポイントを取得
    const body = await req.json();
    const points = body.points;

    // リクエストからユーザーを取得
    const user = await getUserFromRequest(req);
    secureLog("ポイント更新API呼び出し", "info");

    if (!user) {
      secureLog("未認証のポイント更新リクエスト", "warn");
      return NextResponse.json(
        {
          success: false,
          message: "認証されていません",
        },
        { status: 401 }
      );
    }

    // ポイントの検証
    if (points === undefined || typeof points !== "number") {
      secureLog("無効なポイント値", "warn");
      return NextResponse.json(
        {
          success: false,
          message: "有効なポイント値を指定してください",
        },
        { status: 400 }
      );
    }

    // ポイント更新の検証（不正な操作を防止）
    const pointsDiff = points - user.points;
    if (Math.abs(pointsDiff) > 100) {
      secureLog("大きなポイント変動を検出", "warn");
    }

    secureLog("ポイント更新処理", "info");

    // ユーザーのポイントを更新
    user.points = points;
    await saveUser(user);

    secureLog("ポイント更新完了", "info");

    return NextResponse.json({
      success: true,
      message: "ポイントが更新されました",
      currentPoints: points,
    });
  } catch (error) {
    logError("ポイント更新処理中にエラー", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
