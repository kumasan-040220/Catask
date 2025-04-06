import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  generateToken,
  setTokenCookie,
  saveUser,
  convertToRegisteredUser,
} from "@/app/utils/serverAuth";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    let email, code;
    try {
      const body = await req.json();
      email = body.email?.trim();
      code = body.code?.trim();
      console.log("メール認証試行:", email, "コード:", code);
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

    // メールアドレスからユーザーを検索
    const user = await getUserByEmail(email);

    if (!user) {
      console.log("ユーザーが見つかりません:", email);
      return NextResponse.json(
        { success: false, message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    console.log(
      `ユーザーが見つかりました: ${user.id}, 認証状態: ${
        user.verified ? "済" : "未"
      }, 登録状態: ${user.tempUser ? "仮登録" : "本登録"}`
    );

    // 既に認証済み＆本登録済みか確認
    if (user.verified === true && user.tempUser === false) {
      console.log("既に認証済みの本登録アカウント:", email);

      // JWTトークンを生成
      const token = generateToken(user.id);

      // レスポンスを作成
      const response = NextResponse.json({
        success: true,
        message: "アカウントは既に認証されています",
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
    }

    // 認証コードを検証
    console.log(
      `認証コード検証: 入力=${code}, DB保存=${user.verificationCode}`
    );
    if (!user.verificationCode) {
      console.log("データベースに認証コードが設定されていません");
      // 認証コードが設定されていない場合は再送信を提案
      return NextResponse.json(
        {
          success: false,
          message:
            "認証コードが見つかりません。登録をやり直すか、認証コードの再送信をお試しください",
          code: "VERIFICATION_CODE_MISSING",
        },
        { status: 400 }
      );
    }

    if (user.verificationCode !== code) {
      console.log(
        `認証コード不一致: 入力=${code}, DB=${user.verificationCode}`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "入力された認証コードが一致しません。正しい認証コードを入力してください",
          code: "VERIFICATION_CODE_INVALID",
        },
        { status: 400 }
      );
    }

    // 認証コードの有効期限を確認
    if (
      user.verificationExpires &&
      new Date(user.verificationExpires) < new Date()
    ) {
      console.log("認証コードの期限切れ");
      return NextResponse.json(
        {
          success: false,
          message:
            "認証コードの有効期限が切れています。新しいコードを要求してください",
          code: "VERIFICATION_CODE_EXPIRED",
        },
        { status: 400 }
      );
    }

    // 仮登録ユーザーを本登録ユーザーに変換
    console.log(`ユーザー ${user.id} の仮登録を本登録に変換します`);
    const conversionSuccess = await convertToRegisteredUser(user.id);

    if (!conversionSuccess) {
      console.log("本登録への変換に失敗しました");
      return NextResponse.json(
        { success: false, message: "アカウントの有効化に失敗しました" },
        { status: 500 }
      );
    }

    // 変換成功後にユーザー情報を再取得して最新状態を確認
    const updatedUser = await getUserByEmail(email);
    if (!updatedUser || updatedUser.tempUser === true) {
      console.log("本登録変換後のユーザー確認に失敗しました");
      return NextResponse.json(
        { success: false, message: "アカウント情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`ユーザー認証・本登録完了: ${user.id} (${email})`);

    // JWTトークンを生成
    const token = generateToken(user.id);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: "アカウントが正常に認証され、本登録が完了しました。",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        points: updatedUser.points,
        tasks: updatedUser.tasks || [],
      },
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
