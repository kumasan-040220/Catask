import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/utils/serverAuth";
import { decryptData } from "@/app/utils/mongodb";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("[" + new Date().toISOString() + "] 復号化API呼び出し");

    // ユーザー認証を確認
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log("[" + new Date().toISOString() + "] 未認証のリクエスト");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // リクエストボディから暗号化されたテキストを取得
    const { encryptedText } = await req.json();

    if (!encryptedText || typeof encryptedText !== "string") {
      console.log("[" + new Date().toISOString() + "] 無効なリクエスト");
      return NextResponse.json(
        { error: "暗号化されたテキストが必要です" },
        { status: 400 }
      );
    }

    try {
      // 暗号化されたテキストが正しい形式か確認
      if (!encryptedText.includes(":")) {
        return NextResponse.json(
          { error: "無効な暗号化テキスト形式" },
          { status: 400 }
        );
      }

      // テキストを復号化
      const decryptedText = decryptData(encryptedText);
      console.log("[" + new Date().toISOString() + "] テキスト復号化成功");

      return NextResponse.json({
        success: true,
        decryptedText: decryptedText,
      });
    } catch (decryptError) {
      console.error(
        "[" + new Date().toISOString() + "] 復号化エラー:",
        (decryptError as Error).message
      );
      return NextResponse.json(
        { error: "テキストの復号化に失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "[" + new Date().toISOString() + "] 予期せぬエラー:",
      (error as Error).message
    );
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}
