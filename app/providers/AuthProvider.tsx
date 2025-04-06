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
} from "../utils/apiClient";

interface User {
  id: string;
  email: string;
  points: number;
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
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePoints: (points: number) => void;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アプリ起動時にユーザー情報を取得
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const { user, success } = await getCurrentUser();
        if (success && user) {
          setUser(user);
        }
      } catch (err) {
        console.error("ユーザー情報の取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

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
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await registerUser(email, password);

      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        setError(response.message || "登録に失敗しました");
        return false;
      }
    } catch (err) {
      console.error("登録中にエラーが発生しました:", err);
      setError("登録処理中にエラーが発生しました");
      return false;
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
  const updatePoints = (points: number): void => {
    if (user) {
      setUser({ ...user, points });
    }
  };

  // アカウント削除処理
  const deleteAccount = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    setIsLoading(true);

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        setUser(null);
      }

      return result;
    } catch (err) {
      console.error("アカウント削除中にエラーが発生しました:", err);
      return {
        success: false,
        message: "アカウント削除処理中にエラーが発生しました",
      };
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
