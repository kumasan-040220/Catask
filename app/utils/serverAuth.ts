import { NextRequest, NextResponse } from "next/server";
import { User } from "./types";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getCollection, encryptTaskData, decryptTaskData } from "./mongodb";
import { ObjectId } from "mongodb";

// JWTの署名に使用するシークレットキー（本番環境では環境変数から取得する）
const JWT_SECRET = process.env.JWT_SECRET || "catask-secret-key";

// パスワードをハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// パスワードを検証
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// JWTトークンを生成
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// JWTトークンを検証
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// リクエストからユーザーを取得
export async function getUserFromRequest(
  req: NextRequest
): Promise<User | null> {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // ユーザーをMongoDBから検索
  const usersCollection = getCollection("users");
  const user = await usersCollection.findOne({
    _id: new ObjectId(decoded.userId),
  });

  if (!user) {
    return null;
  }

  // タスクデータを復号化
  let userWithDecryptedTasks = {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
    points: user.points,
    tasks: user.tasks || [],
    catAvatar: user.catAvatar || null,
  };

  // タスクデータがある場合は復号化
  if (
    userWithDecryptedTasks.tasks &&
    Array.isArray(userWithDecryptedTasks.tasks)
  ) {
    try {
      // 復号化前のタスク数をログに記録
      console.log(
        `[${new Date().toISOString()}] ${
          userWithDecryptedTasks.tasks.length
        }件のタスクを復号化します`
      );

      // 暗号化されたタイトルを持つタスクの数を確認
      const encryptedTitlesCount = userWithDecryptedTasks.tasks.filter(
        (task) =>
          task.title &&
          typeof task.title === "string" &&
          task.title.includes(":") &&
          task.title.split(":")[0].length === 32
      ).length;

      if (encryptedTitlesCount > 0) {
        console.log(
          `[${new Date().toISOString()}] ${encryptedTitlesCount}件の暗号化タイトルを検出しました`
        );
      }

      // タスクデータを復号化
      userWithDecryptedTasks.tasks = decryptTaskData(
        userWithDecryptedTasks.tasks
      );

      // 復号化が成功したかどうかを確認
      const stillEncryptedCount = userWithDecryptedTasks.tasks.filter(
        (task) =>
          task.title &&
          typeof task.title === "string" &&
          task.title.includes(":") &&
          task.title.split(":")[0].length === 32
      ).length;

      if (stillEncryptedCount > 0) {
        console.warn(
          `[${new Date().toISOString()}] 警告: ${stillEncryptedCount}件のタスクタイトルが復号化されませんでした`
        );
      } else {
        console.log(
          `[${new Date().toISOString()}] すべてのタスクが正常に復号化されました`
        );
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] タスクデータの復号化中にエラーが発生しました:`,
        error
      );
      // エラーが発生しても処理を続行できるよう、元のタスクデータを維持
    }
  }

  return userWithDecryptedTasks;
}

// 全ユーザーを取得
export async function getUsers(): Promise<User[]> {
  const usersCollection = getCollection("users");
  const users = await usersCollection.find({}).toArray();

  // ユーザーデータを変換し、タスクを復号化
  return users.map((user) => {
    let userData = {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      points: user.points,
      tasks: user.tasks || [],
      catAvatar: user.catAvatar || null,
    };

    // タスクデータを復号化
    if (userData.tasks && Array.isArray(userData.tasks)) {
      try {
        // 復号化前のタスク数をログに記録
        console.log(
          `[${new Date().toISOString()}] ${
            userData.tasks.length
          }件のタスクを復号化します`
        );

        // 暗号化されたタイトルを持つタスクの数を確認
        const encryptedTitlesCount = userData.tasks.filter(
          (task) =>
            task.title &&
            typeof task.title === "string" &&
            task.title.includes(":") &&
            task.title.split(":")[0].length === 32
        ).length;

        if (encryptedTitlesCount > 0) {
          console.log(
            `[${new Date().toISOString()}] ${encryptedTitlesCount}件の暗号化タイトルを検出しました`
          );
        }

        // タスクデータを復号化
        userData.tasks = decryptTaskData(userData.tasks);

        // 復号化が成功したかどうかを確認
        const stillEncryptedCount = userData.tasks.filter(
          (task) =>
            task.title &&
            typeof task.title === "string" &&
            task.title.includes(":") &&
            task.title.split(":")[0].length === 32
        ).length;

        if (stillEncryptedCount > 0) {
          console.warn(
            `[${new Date().toISOString()}] 警告: ${stillEncryptedCount}件のタスクタイトルが復号化されませんでした`
          );
        } else {
          console.log(
            `[${new Date().toISOString()}] すべてのタスクが正常に復号化されました`
          );
        }
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] タスクデータの復号化中にエラーが発生しました:`,
          error
        );
        // エラーが発生しても処理を続行できるよう、元のタスクデータを維持
      }
    }

    return userData;
  });
}

// ユーザーを保存（新規または更新）
export async function saveUser(user: User): Promise<void> {
  const usersCollection = getCollection("users");

  // ユーザーデータのコピーを作成
  const userToSave = { ...user };

  // デバッグログ（認証コード関連）
  if (userToSave.verificationCode) {
    console.log(`保存する認証コード: ${userToSave.verificationCode}`);
  }

  // タスクデータを暗号化
  if (userToSave.tasks && Array.isArray(userToSave.tasks)) {
    userToSave.tasks = encryptTaskData(userToSave.tasks);
  }

  // idがある場合は既存ユーザーの更新
  if (userToSave.id) {
    const { id, ...userData } = userToSave;
    console.log(
      `ユーザー更新: ID=${id}, メール=${userData.email}, 認証コード=${
        userData.verificationCode || "未設定"
      }`
    );

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: userData }
    );

    console.log(
      `更新結果: 一致=${result.matchedCount}, 更新=${result.modifiedCount}`
    );
  }
  // 新規ユーザーの作成
  else {
    console.log(
      `新規ユーザー作成: メール=${userToSave.email}, 認証コード=${
        userToSave.verificationCode || "未設定"
      }`
    );

    const result = await usersCollection.insertOne({
      email: userToSave.email,
      password: userToSave.password,
      createdAt: userToSave.createdAt,
      points: userToSave.points || 0,
      tasks: userToSave.tasks || [],
      catAvatar: userToSave.catAvatar || null,
      tempUser: userToSave.tempUser || false, // 仮登録フラグを追加
      verificationCode: userToSave.verificationCode,
      verificationExpires: userToSave.verificationExpires,
      verified: userToSave.verified || false,
    });

    console.log(`作成結果: ID=${result.insertedId}`);
  }
}

// 複数ユーザーを保存（ファイルベースの互換性のため）
export async function saveUsers(users: User[]): Promise<void> {
  const usersCollection = getCollection("users");

  // 各ユーザーを処理
  for (const user of users) {
    // ユーザーデータのコピーを作成
    const userToSave = { ...user };

    // タスクデータを暗号化
    if (userToSave.tasks && Array.isArray(userToSave.tasks)) {
      userToSave.tasks = encryptTaskData(userToSave.tasks);
    }

    if (userToSave.id) {
      // 既存ユーザーの更新
      const { id, ...userData } = userToSave;
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: userData },
        { upsert: true }
      );
    } else {
      // 新規ユーザーの作成
      await usersCollection.insertOne({
        email: userToSave.email,
        password: userToSave.password,
        createdAt: userToSave.createdAt,
        points: userToSave.points || 0,
        tasks: userToSave.tasks || [],
        catAvatar: userToSave.catAvatar || null,
      });
    }
  }
}

// メールアドレスからユーザーを取得
export async function getUserByEmail(email: string): Promise<User | null> {
  const usersCollection = getCollection("users");
  const user = await usersCollection.findOne({ email });

  if (!user) {
    return null;
  }

  let userWithDecryptedTasks = {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
    points: user.points,
    tasks: user.tasks || [],
    verified: user.verified,
    verificationCode: user.verificationCode,
    verificationExpires: user.verificationExpires,
    tempUser: user.tempUser || false, // 仮登録フラグの取得
    catAvatar: user.catAvatar || null,
  };

  console.log("DB取得ユーザー情報:", {
    id: userWithDecryptedTasks.id,
    email: userWithDecryptedTasks.email,
    verified: userWithDecryptedTasks.verified,
    tempUser: userWithDecryptedTasks.tempUser,
    verificationCode: userWithDecryptedTasks.verificationCode || "未設定",
    verificationExpires: userWithDecryptedTasks.verificationExpires || "未設定",
  });

  // タスクデータがある場合は復号化
  if (
    userWithDecryptedTasks.tasks &&
    Array.isArray(userWithDecryptedTasks.tasks)
  ) {
    try {
      userWithDecryptedTasks.tasks = decryptTaskData(
        userWithDecryptedTasks.tasks
      );
    } catch (error) {
      console.error("タスクデータの復号化中にエラーが発生しました:", error);
      // エラーが発生しても処理を続行できるよう、元のタスクデータを維持
    }
  }

  return userWithDecryptedTasks;
}

// レスポンスにトークンをセット
export function setTokenCookie(res: NextResponse, token: string): void {
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7日間
    path: "/",
  });
}

// レスポンスからトークンを削除
export function clearTokenCookie(res: NextResponse): void {
  res.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}

// 仮登録ユーザーから本登録ユーザーに変換する
export async function convertToRegisteredUser(
  userId: string
): Promise<boolean> {
  try {
    console.log(`ユーザー ${userId} を仮登録から本登録に変換します`);
    const usersCollection = getCollection("users");

    // ユーザーを仮登録から本登録に変更
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          tempUser: false,
          verified: true,
        },
        $unset: {
          verificationCode: "",
          verificationExpires: "",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`ユーザー ${userId} の本登録が完了しました`);
      return true;
    } else {
      console.log(`ユーザー ${userId} の変換に失敗しました`);
      return false;
    }
  } catch (error) {
    console.error("仮登録ユーザーの本登録変換中にエラー:", error);
    return false;
  }
}
