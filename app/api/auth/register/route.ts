import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  hashPassword,
  generateToken,
  saveUser,
  setTokenCookie,
} from "@/app/utils/serverAuth";
import { User } from "@/app/utils/types";
import {
  generateVerificationCode,
  sendVerificationEmail,
  isEmailEnabled,
} from "@/app/utils/emailService";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    let email, password;
    try {
      const body = await req.json();
      email = body.email?.trim();
      password = body.password;
      console.log("新規登録試行:", email);
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

    // メールアドレスの形式を検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("入力検証エラー: メールアドレスの形式が無効", email);
      return NextResponse.json(
        { success: false, message: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // パスワードの長さを検証
    if (password.length < 6) {
      console.log("入力検証エラー: パスワードが短すぎます");
      return NextResponse.json(
        {
          success: false,
          message: "パスワードは6文字以上である必要があります",
        },
        { status: 400 }
      );
    }

    // メールアドレスが既に登録されているか確認
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      console.log("メールアドレス重複エラー:", email);
      return NextResponse.json(
        { success: false, message: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(password);
      console.log("パスワードをハッシュ化しました");
    } catch (error) {
      console.error("パスワードのハッシュ化に失敗:", error);
      return NextResponse.json(
        { success: false, message: "アカウント作成中にエラーが発生しました" },
        { status: 500 }
      );
    }

    // メール機能の利用可否をチェック
    const requireVerification = isEmailEnabled();
    console.log(`メール認証機能: ${requireVerification ? "有効" : "無効"}`);

    // 新しいユーザーオブジェクトを作成（共通部分）
    const newUser = {
      email,
      password: hashedPassword,
      createdAt: new Date(),
      points: 0,
      tasks: [],
      verified: !requireVerification, // メール認証が必要ない場合は最初から認証済み
    };

    // メール認証が有効な場合は認証情報を追加
    if (requireVerification) {
      const verificationCode = generateVerificationCode();

      // 登録時の認証コードを確認するログ
      console.log(`新規ユーザー（${email}）の認証コード: ${verificationCode}`);

      // 認証コードの有効期限を設定（1時間）
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 1);

      // 認証情報を追加
      Object.assign(newUser, {
        tempUser: true, // 仮登録フラグを追加
        verificationCode: verificationCode,
        verificationExpires: verificationExpires,
      });

      console.log("仮登録ユーザー作成準備完了");

      // 認証メールを送信
      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        console.error(`認証メールの送信に失敗しました（${email}）`);
        return NextResponse.json(
          {
            success: false,
            message:
              "アカウントは作成されましたが、認証メールの送信に失敗しました。",
          },
          { status: 500 }
        );
      }
    } else {
      console.log("メール認証なしでユーザーを作成します");
    }

    // ユーザーを保存
    // @ts-ignore - IDフィールドの型エラーを一時的に無視
    await saveUser(newUser as User);

    // 保存後にメールアドレスで再取得して自動生成されたIDを取得
    const savedUser = await getUserByEmail(email);
    if (!savedUser) {
      console.error("ユーザーの作成に失敗しました");
      return NextResponse.json(
        { success: false, message: "ユーザーの作成に失敗しました" },
        { status: 500 }
      );
    }

    console.log("ユーザーの作成に成功しました。ID:", savedUser.id);

    // メール認証が必要な場合
    if (requireVerification) {
      // ユーザーのverificationCodeが正しく保存されたか確認
      console.log(
        `検証用情報: コード=${savedUser.verificationCode}, 有効期限=${savedUser.verificationExpires}, 仮登録=${savedUser.tempUser}`
      );

      // もし認証コードが保存されていない場合は再度保存を試みる
      if (
        !savedUser.verificationCode ||
        savedUser.verificationCode !== newUser.verificationCode
      ) {
        console.log("認証コードが正しく保存されていないため再設定します");
        savedUser.verificationCode = newUser.verificationCode;
        await saveUser(savedUser);

        // 再度確認
        const recheckUser = await getUserByEmail(email);
        console.log(
          `再保存後の検証コード: ${recheckUser?.verificationCode || "なし"}`
        );
      }

      console.log(`認証フロー開始: ユーザー ${savedUser.id} (${email})`);

      // 認証が必要なことを示す応答を返す
      return NextResponse.json({
        success: true,
        message:
          "仮登録が完了しました。メールアドレスの認証でアカウントが有効化されます。",
        needsVerification: true,
      });
    }

    // メール認証が不要な場合は直接ログインさせる
    // JWTトークンを生成
    const token = generateToken(savedUser.id);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        points: savedUser.points,
        tasks: savedUser.tasks || [],
      },
      message: "アカウントが正常に作成されました",
    });

    // クッキーにトークンをセット
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error("ユーザー登録中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
