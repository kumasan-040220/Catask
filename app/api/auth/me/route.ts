import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, saveUser } from "@/app/utils/serverAuth";

export async function GET(req: NextRequest) {
  try {
    // リクエストからユーザーを取得
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "認証されていません",
        },
        { status: 401 }
      );
    }

    // パスワードを含まないユーザー情報を返す
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        points: user.points,
        tasks: user.tasks,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("ユーザー情報取得中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
