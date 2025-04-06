import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  hashPassword,
  generateToken,
  saveUser,
  setTokenCookie,
} from "@/app/utils/serverAuth";
import { User } from "@/app/utils/types";

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

    // 新しいユーザーを作成
    const newUser = {
      id: undefined, // MongoDBが_idを自動生成
      email,
      password: hashedPassword,
      createdAt: new Date(),
      points: 0,
      tasks: [],
    };
    console.log("新規ユーザー作成準備完了");

    // ユーザーを保存
    await saveUser(newUser);

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
    });

    // クッキーにトークンをセット
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error("登録中にエラーが発生しました:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
