import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  saveUser,
  generateToken,
  setTokenCookie,
} from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    let email, code;
    try {
      const body = await req.json();
      email = body.email?.trim();
      code = body.code?.trim();
      console.log("メール認証リクエスト:", email, "コード:", code);
    } catch (error) {
      console.error("リクエストボディの解析に失敗:", error);
      return NextResponse.json(
        { success: false, message: "無効なリクエスト形式です" },
        { status: 400 }
      );
    }

    // 入力検証
    if (!email || !code) {
      console.log("入力検証エラー: メールアドレスまたは認証コードが未入力");
      return NextResponse.json(
        { success: false, message: "メールアドレスと認証コードは必須です" },
        { status: 400 }
      );
    }

    // ユーザーの検索
    const user = await getUserByEmail(email);

    if (!user) {
      console.log("ユーザーが見つかりません:", email);
      return NextResponse.json(
        { success: false, message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    console.log("ユーザーが見つかりました:", user.id);

    // 既に認証済みか確認
    if (user.verified === true) {
      console.log("既に認証済みのアカウント:", email);
      return NextResponse.json(
        {
          success: true,
          message: "このアカウントは既に認証されています",
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // 認証コードと有効期限を確認
    if (!user.verificationCode || user.verificationCode !== code) {
      console.log("認証コードが一致しません");
      return NextResponse.json(
        { success: false, message: "認証コードが一致しません" },
        { status: 400 }
      );
    }

    // 有効期限を確認
    if (
      user.verificationExpires &&
      new Date() > new Date(user.verificationExpires)
    ) {
      console.log("認証コードの有効期限が切れています");
      return NextResponse.json(
        {
          success: false,
          message:
            "認証コードの有効期限が切れています。新しいコードを要求してください。",
          expired: true,
        },
        { status: 400 }
      );
    }

    // ユーザーを認証済みに設定
    user.verified = true;
    user.tempUser = false; // 仮登録フラグを削除

    // 不要になった認証情報をクリア
    delete user.verificationCode;
    delete user.verificationExpires;

    // ユーザー情報を保存
    await saveUser(user);

    console.log(`ユーザー認証完了. ID: ${user.id}, Email: ${email}`);

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
      message: "メールアドレスの認証が完了しました",
    });

    // クッキーにトークンをセット
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error("メール認証中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
