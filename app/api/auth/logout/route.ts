import { NextRequest, NextResponse } from "next/server";
import { clearTokenCookie } from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    });

    // クッキーからトークンを削除
    clearTokenCookie(response);

    return response;
  } catch (error) {
    console.error("ログアウト中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
