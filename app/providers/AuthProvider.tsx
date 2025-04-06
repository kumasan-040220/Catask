"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  deleteUserAccount,
  verifyEmail,
  resendVerification,
} from "../utils/apiClient";

interface User {
  id: string;
  email: string;
  points: number;
  verified?: boolean;
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    createdAt: string | Date;
    estimatedTime: number;
    dueDate: string | Date | null;
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    needsVerification?: boolean;
    email?: string;
    message?: string;
  }>;
  logout: () => Promise<void>;
  updatePoints: (points: number) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  forceRefresh: () => Promise<boolean>;
  verifyUserEmail: (email: string, code: string) => Promise<boolean>;
  resendVerificationCode: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザー情報を取得する関数
  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("ユーザーデータの読み込みに失敗しました");
      }

      const userData = await response.json();

      // ユーザーのタスクデータを正規化
      if (userData.user && userData.user.tasks) {
        // 重複チェックと除去
        const uniqueTasksMap = new Map();
        let duplicatesFound = 0;

        userData.user.tasks.forEach((task) => {
          if (task && task.id) {
            if (uniqueTasksMap.has(task.id)) {
              duplicatesFound++;
            } else {
              // タスクの日付データを正規化
              if (task.createdAt && typeof task.createdAt === "string") {
                task.createdAt = new Date(task.createdAt);
              }
              if (task.dueDate && typeof task.dueDate === "string") {
                task.dueDate = new Date(task.dueDate);
              }

              // completedプロパティを確実にbooleanに
              task.completed = Boolean(task.completed);

              uniqueTasksMap.set(task.id, task);
            }
          }
        });

        // 重複があれば警告ログを出す
        if (duplicatesFound > 0) {
          console.warn(
            `AuthProvider: ${duplicatesFound}件の重複タスクを排除しました`
          );
        }

        // 重複排除済みのタスク配列を設定
        userData.user.tasks = Array.from(uniqueTasksMap.values());
        console.log(
          `AuthProvider: タスク読み込み完了 (${userData.user.tasks.length}件)`
        );
      }

      setUser(userData.user);
      setIsLoading(false);
    } catch (error) {
      console.error("ユーザーデータの読み込み中にエラーが発生しました:", error);
      setError("ユーザーデータの読み込みに失敗しました");
      setIsLoading(false);
    }
  };

  // アプリ起動時にユーザー情報を取得
  useEffect(() => {
    loadUserData();
  }, []);

  // ユーザー情報を強制的に更新する関数
  const forceRefresh = async () => {
    setIsLoading(true);
    setError(null);
    console.log("AuthProvider: ユーザーデータの強制更新を開始");

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // クッキーを含める
      });

      if (!response.ok) {
        throw new Error(
          `ユーザーデータの取得に失敗: ${response.status} ${response.statusText}`
        );
      }

      const userData = await response.json();

      if (!userData.success || !userData.user) {
        throw new Error("ユーザーデータが不正な形式です");
      }

      console.log(
        `AuthProvider: ユーザーデータを更新しました (ID: ${userData.user.id})`
      );

      // ユーザーのタスクデータを正規化
      if (userData.user && userData.user.tasks) {
        // 重複チェックと除去
        const uniqueTasksMap = new Map();
        let duplicatesFound = 0;

        userData.user.tasks.forEach((task) => {
          if (task && task.id) {
            if (uniqueTasksMap.has(task.id)) {
              duplicatesFound++;
            } else {
              // タスクの日付データを正規化
              if (task.createdAt && typeof task.createdAt === "string") {
                task.createdAt = new Date(task.createdAt);
              }
              if (task.dueDate && typeof task.dueDate === "string") {
                task.dueDate = new Date(task.dueDate);
              }

              // completedプロパティを確実にbooleanに
              task.completed = Boolean(task.completed);

              uniqueTasksMap.set(task.id, task);
            }
          }
        });

        // 重複があれば警告ログを出す
        if (duplicatesFound > 0) {
          console.warn(
            `AuthProvider: forceRefresh中に${duplicatesFound}件の重複タスクを排除しました`
          );
        }

        // 重複排除済みのタスク配列を設定
        userData.user.tasks = Array.from(uniqueTasksMap.values());
        console.log(
          `AuthProvider: タスク更新完了 (${
            userData.user.tasks.length
          }件), うち完了:${
            userData.user.tasks.filter((t) => t.completed).length
          }件`
        );
      }

      setUser(userData.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("AuthProvider: ユーザーデータの強制更新に失敗:", error);
      setError("データの更新に失敗しました");
      setIsLoading(false);
      return false;
    }
  };

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await loginUser(email, password);

      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        setError(response.message || "ログインに失敗しました");
        return false;
      }
    } catch (err) {
      console.error("ログイン中にエラーが発生しました:", err);
      setError("ログイン処理中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登録処理
  const register = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    needsVerification?: boolean;
    email?: string;
    message?: string;
  }> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await registerUser(email, password);

      console.log("ユーザー登録レスポンス:", response);

      if (response.success) {
        // 認証が必要かどうかに関わらず、needsVerificationをtrueに設定
        // これにより認証コード入力画面が必ず表示される
        return {
          success: true,
          needsVerification: true,
          email,
          message: response.message,
        };
      }

      setError(response.message || "登録に失敗しました");
      return {
        success: false,
        message: response.message,
      };
    } catch (err) {
      console.error("登録中にエラーが発生しました:", err);
      setError("登録処理中にエラーが発生しました");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("ログアウト中にエラーが発生しました:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ポイント更新処理
  const updatePoints = async (points: number): Promise<boolean> => {
    if (user) {
      console.log(`ポイント更新: ${user.points || 0} → ${points}`);
      setUser({ ...user, points });
      return true;
    }
    return false;
  };

  // アカウント削除処理
  const deleteAccount = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        setUser(null);
      }

      return result.success;
    } catch (err) {
      console.error("アカウント削除中にエラーが発生しました:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // メールアドレスの認証
  const verifyUserEmail = async (
    email: string,
    code: string
  ): Promise<boolean> => {
    if (!email || !code) return false;

    setIsLoading(true);
    setError("");

    try {
      console.log("認証処理開始:", email, "コード:", code);
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      console.log("認証API応答:", data);

      if (data.success) {
        // 認証成功時は新しいユーザー情報を直接設定
        if (data.user) {
          console.log("認証成功 - ユーザー情報を更新:", data.user.email);

          // タスクデータがある場合は正しい形式に変換
          if (data.user.tasks && Array.isArray(data.user.tasks)) {
            data.user.tasks = data.user.tasks.map((task: any) => ({
              ...task,
              createdAt: new Date(task.createdAt),
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              completed: !!task.completed, // Booleanに確実に変換
            }));
          }

          setUser(data.user);
          setIsLoading(false);

          // ローカルストレージにも認証成功を記録
          try {
            localStorage.setItem("auth_success", "true");
          } catch (e) {
            console.error("ローカルストレージ更新エラー:", e);
          }

          return true;
        } else {
          console.warn("認証は成功しましたが、ユーザー情報がありません");
          setError("ユーザー情報の取得に失敗しました");
        }
      } else {
        console.error("認証失敗:", data.message);
        setError(data.message || "認証に失敗しました");
      }
    } catch (error) {
      console.error("認証処理中にエラーが発生しました:", error);
      setError("認証処理中にエラーが発生しました");
    }

    setIsLoading(false);
    return false;
  };

  // 認証コードの再送信
  const resendVerificationCode = async (email: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await resendVerification(email);

      if (response.success) {
        return true;
      } else {
        setError(response.message || "認証コードの再送信に失敗しました");
        return false;
      }
    } catch (err) {
      console.error("認証コード再送信中にエラーが発生しました:", err);
      setError("認証コード再送信中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updatePoints,
    deleteAccount,
    refreshUser: loadUserData, // ユーザー情報を再取得する関数を公開
    forceRefresh,
    verifyUserEmail,
    resendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
