import { v4 as uuidv4 } from "uuid";
import { User, Task } from "./types";

// ユーザー一覧をローカルストレージから取得
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return [];

  const storedUsers = localStorage.getItem("users");
  if (!storedUsers) return [];

  try {
    const users = JSON.parse(storedUsers);
    return users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      tasks: user.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })),
    }));
  } catch (error) {
    console.error("ユーザー情報の取得に失敗しました", error);
    return [];
  }
};

// ユーザー一覧をローカルストレージに保存
export const saveUsers = (users: User[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("users", JSON.stringify(users));
};

// 新しいユーザーを作成
export const createUser = (email: string, password: string): User => {
  return {
    id: uuidv4(),
    email,
    password, // 実際の実装では暗号化するべき
    createdAt: new Date(),
    points: 0,
    tasks: [],
  };
};

// ユーザー登録
export const registerUser = (email: string, password: string): User | null => {
  const users = getUsers();

  // メールアドレスが既に使用されているかチェック
  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return null; // 既に登録済み
  }

  // 新規ユーザー作成
  const newUser = createUser(email, password);
  users.push(newUser);
  saveUsers(users);

  return newUser;
};

// ユーザーログイン
export const loginUser = (email: string, password: string): User | null => {
  const users = getUsers();

  // メールアドレスとパスワードが一致するユーザーを検索
  const user = users.find(
    (user) => user.email === email && user.password === password
  );
  if (!user) {
    return null; // ログイン失敗
  }

  return user;
};

// 現在ログイン中のユーザーをローカルストレージから取得
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const currentUserId = localStorage.getItem("currentUserId");
  if (!currentUserId) return null;

  const users = getUsers();
  return users.find((user) => user.id === currentUserId) || null;
};

// ユーザーログイン状態を保存
export const setCurrentUser = (user: User | null): void => {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem("currentUserId", user.id);
  } else {
    localStorage.removeItem("currentUserId");
  }
};

// ユーザーログアウト
export const logoutUser = (): void => {
  setCurrentUser(null);
};

// ユーザーのタスクを保存
export const saveUserTasks = (userId: string, tasks: Task[]): void => {
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex >= 0) {
    users[userIndex].tasks = tasks;
    saveUsers(users);
  }
};

// ユーザーのポイントを更新
export const updateUserPoints = (userId: string, points: number): void => {
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex >= 0) {
    users[userIndex].points = points;
    saveUsers(users);
  }
};
