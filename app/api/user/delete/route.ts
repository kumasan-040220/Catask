import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, clearTokenCookie } from "@/app/utils/serverAuth";
import { getCollection } from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest) {
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

    // ユーザーIDを取得
    const userId = user.id;
    console.log(`ユーザー削除リクエスト - ユーザーID: ${userId}`);

    // MongoDBからユーザーを削除
    const usersCollection = getCollection("users");
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      console.error(`ユーザー削除失敗 - ユーザーが見つかりません: ${userId}`);
      return NextResponse.json(
        { success: false, message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    console.log(`ユーザー削除成功 - ユーザーID: ${userId}`);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: "アカウントが削除されました",
    });

    // トークンをクリア（ログアウト処理）
    clearTokenCookie(response);

    return response;
  } catch (error) {
    console.error("アカウント削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
