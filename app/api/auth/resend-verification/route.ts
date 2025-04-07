import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, saveUser } from "@/app/utils/serverAuth";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "@/app/utils/emailService";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    let email;
    try {
      const body = await req.json();
      email = body.email?.trim();
      console.log("認証コード再送信リクエスト:", email);
    } catch (error) {
      console.error("リクエストボディの解析に失敗:", error);
      return NextResponse.json(
        { success: false, message: "無効なリクエスト形式です" },
        { status: 400 }
      );
    }

    // 入力検証
    if (!email) {
      console.log("入力検証エラー: メールアドレスが未入力");
      return NextResponse.json(
        { success: false, message: "メールアドレスは必須です" },
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
        { success: false, message: "このアカウントは既に認証されています" },
        { status: 400 }
      );
    }

    // 新しい認証コードを生成
    const verificationCode = generateVerificationCode();
    
    // コードの生成を確認するログ
    console.log(`新しい認証コードを生成しました: ${verificationCode}`);

    // 認証コードの有効期限を設定（1時間）
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 1);

    // ユーザー情報を更新
    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;

    // ユーザー情報を保存
    await saveUser(user);
    
    console.log(`ユーザー情報を更新しました. ID: ${user.id}, コード: ${verificationCode}`);

    // 認証メールを送信
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      console.error("認証メールの送信に失敗しました:", email);
      return NextResponse.json(
        { success: false, message: "認証メールの送信に失敗しました" },
        { status: 500 }
      );
    }

    console.log("認証メールを送信しました:", email);

    return NextResponse.json({
      success: true,
      message: "認証コードを再送信しました",
    });
  } catch (error) {
    console.error("認証コード再送信中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
