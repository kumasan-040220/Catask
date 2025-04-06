import { NextRequest, NextResponse } from "next/server";
import { User } from "./types";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getCollection } from "./mongodb";
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

  // MongoDBの_idをidフィールドに変換
  return {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
    points: user.points,
    tasks: user.tasks,
  };
}

// 全ユーザーを取得
export async function getUsers(): Promise<User[]> {
  const usersCollection = getCollection("users");
  const users = await usersCollection.find({}).toArray();

  // MongoDBの_idをidフィールドに変換
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
    points: user.points,
    tasks: user.tasks || [],
  }));
}

// ユーザーを保存（新規または更新）
export async function saveUser(user: User): Promise<void> {
  const usersCollection = getCollection("users");

  // idがある場合は既存ユーザーの更新
  if (user.id) {
    const { id, ...userData } = user;
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: userData }
    );
  }
  // 新規ユーザーの作成
  else {
    await usersCollection.insertOne({
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      points: user.points || 0,
      tasks: user.tasks || [],
    });
  }
}

// 複数ユーザーを保存（ファイルベースの互換性のため）
export async function saveUsers(users: User[]): Promise<void> {
  const usersCollection = getCollection("users");

  // 各ユーザーを処理
  for (const user of users) {
    if (user.id) {
      // 既存ユーザーの更新
      const { id, ...userData } = user;
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: userData },
        { upsert: true }
      );
    } else {
      // 新規ユーザーの作成
      await usersCollection.insertOne({
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
        points: user.points || 0,
        tasks: user.tasks || [],
      });
    }
  }
}

// メールアドレスでユーザーを検索
export async function getUserByEmail(email: string): Promise<User | null> {
  const usersCollection = getCollection("users");
  const user = await usersCollection.findOne({ email });

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    createdAt: user.createdAt,
    points: user.points,
    tasks: user.tasks || [],
  };
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
