"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/app/components/auth/LoginForm";
import RegisterForm from "@/app/components/auth/RegisterForm";
import { useAuth } from "@/app/providers/AuthProvider";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // ユーザー情報が既に存在する場合はダッシュボードにリダイレクト
  useEffect(() => {
    console.log(
      "AuthPage: 初期化時のユーザー状態:",
      user ? "ログイン済" : "未ログイン"
    );
    console.log("AuthPage: ローディング状態:", isLoading);

    if (!isLoading && user) {
      console.log(
        "AuthPage: ログイン済みユーザーを検出、ダッシュボードへリダイレクト"
      );
      router.push("/");
    }
  }, [user, isLoading, router]);

  // ローディング中はローディング表示
  if (isLoading) {
    console.log("AuthPage: ローディング表示");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    console.log("AuthPage: 認証/ログイン成功、ダッシュボードへリダイレクト");
    router.push("/");
  };

  // 現在のモードに応じてログインまたは登録フォームを表示
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isLogin ? "Catask にログイン" : "Catask に登録"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin
              ? "タスク管理を猫と一緒に楽しみましょう"
              : "アカウントを作成して猫と一緒にタスク管理を始めましょう"}
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={handleSuccess}
            onRegisterClick={() => {
              console.log("AuthPage: 登録フォームに切り替え");
              setIsLogin(false);
            }}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onLoginClick={() => {
              console.log("AuthPage: ログインフォームに切り替え");
              setIsLogin(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
