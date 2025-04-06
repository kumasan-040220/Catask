import { AuthResponse, ApiError, User, Task } from "./types";

// ユーザー登録
export async function registerUser(
  email: string,
  password: string
): Promise<AuthResponse | ApiError> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return await response.json();
  } catch (error) {
    console.error("登録処理中にエラーが発生しました", error);
    return {
      success: false,
      message:
        "通信エラーが発生しました。インターネット接続を確認してください。",
    };
  }
}

// ユーザーログイン
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse | ApiError> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("ログインレスポンス:", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("ログイン処理中にエラーが発生しました", error);
    return {
      success: false,
      message:
        "通信エラーが発生しました。インターネット接続を確認してください。",
    };
  }
}

// ユーザーログアウト
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    return await response.json();
  } catch (error) {
    console.error("ログアウト処理中にエラーが発生しました", error);
    return { success: false };
  }
}

// 現在のユーザー情報を取得
export async function getCurrentUser(): Promise<{
  user: User | null;
  success: boolean;
}> {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    console.log("ユーザー情報取得レスポンス:", JSON.stringify(data));

    if (data.success && data.user) {
      return { user: data.user, success: true };
    }

    return { user: null, success: false };
  } catch (error) {
    console.error("ユーザー情報の取得中にエラーが発生しました", error);
    return { user: null, success: false };
  }
}

// ユーザーのタスクを更新
export async function updateUserTasks(
  tasks: Task[]
): Promise<{ success: boolean }> {
  try {
    const response = await fetch("/api/tasks/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tasks }),
    });

    return await response.json();
  } catch (error) {
    console.error("タスクの更新中にエラーが発生しました", error);
    return { success: false };
  }
}

// ユーザーのポイントを更新
export async function updateUserPoints(
  points: number
): Promise<{ success: boolean }> {
  try {
    const response = await fetch("/api/user/update-points", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ points }),
    });

    return await response.json();
  } catch (error) {
    console.error("ポイントの更新中にエラーが発生しました", error);
    return { success: false };
  }
}

// ユーザーアカウントを削除
export async function deleteUserAccount(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await fetch("/api/user/delete", {
      method: "DELETE",
    });

    return await response.json();
  } catch (error) {
    console.error("アカウント削除中にエラーが発生しました", error);
    return {
      success: false,
      message:
        "通信エラーが発生しました。インターネット接続を確認してください。",
    };
  }
}
