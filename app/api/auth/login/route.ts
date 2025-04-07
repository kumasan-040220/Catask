import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  generateToken,
  setTokenCookie,
  getUserByEmail,
  saveUser,
} from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    let email, password;
    try {
      const body = await req.json();
      email = body.email;
      password = body.password;
      console.log("ログイン試行:", email);
    } catch (error) {
      console.error("リクエストボディの解析に失敗:", error);
      return NextResponse.json(
        { success: false, message: "無効なリクエスト形式です" },
        { status: 400 }
      );
    }

    // 入力検証
    if (!email || !password) {
      console.log("入力検証エラー: メールアドレスまたはパスワードが未入力");
      return NextResponse.json(
        { success: false, message: "メールアドレスとパスワードは必須です" },
        { status: 400 }
      );
    }

    // メールアドレスからユーザーを検索
    const user = await getUserByEmail(email);

    if (!user) {
      console.log("ユーザーが見つかりません:", email);
      return NextResponse.json(
        {
          success: false,
          message: "メールアドレスまたはパスワードが正しくありません",
        },
        { status: 401 }
      );
    }

    console.log("ユーザーが見つかりました:", user.id);

    // メール認証が完了しているか確認
    if (user.verified === false) {
      console.log("未認証のアカウント:", email);
      return NextResponse.json(
        {
          success: false,
          message:
            "アカウントが未認証です。メールに送信された認証コードを使用して認証を完了してください。",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // パスワードを検証
    let isPasswordValid;
    try {
      isPasswordValid = await verifyPassword(password, user.password);
      console.log("パスワード検証結果:", isPasswordValid);
    } catch (error) {
      console.error("パスワード検証中にエラー:", error);
      return NextResponse.json(
        { success: false, message: "認証処理中にエラーが発生しました" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      console.log("パスワードが一致しません");
      return NextResponse.json(
        {
          success: false,
          message: "メールアドレスまたはパスワードが正しくありません",
        },
        { status: 401 }
      );
    }

    // JWTトークンを生成
    const token = generateToken(user.id);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        points: user.points,
        tasks: user.tasks || [],
      },
    });

    // クッキーにトークンをセット
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error("ログイン中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
