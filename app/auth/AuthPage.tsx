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

  useEffect(() => {
    // 既にログインしている場合はダッシュボードにリダイレクト
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleAuthSuccess = () => {
    router.push("/dashboard");
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onRegisterClick={toggleAuthMode}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onLoginClick={toggleAuthMode}
          />
        )}
      </div>
    </div>
  );
}
