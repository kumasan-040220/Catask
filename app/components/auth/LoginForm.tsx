"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
}

export default function LoginForm({
  onSuccess,
  onRegisterClick,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, isLoading } = useAuth();

  // エラーメッセージを3秒後に消す
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (error) {
      timeoutId = setTimeout(() => {
        // AuthProviderのエラーを直接クリアできないので、エラー表示を制御する状態を追加
        setDisplayError(false);
      }, 1800);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [error]);

  // エラー表示の制御
  const [displayError, setDisplayError] = useState(true);

  // エラーが変わったらdisplayErrorをtrueにリセット
  useEffect(() => {
    setDisplayError(true);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 入力検証
    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = await login(email, password);
    if (success) {
      onSuccess();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">ログイン</h2>

      {error && displayError && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="パスワード"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? "非表示" : "表示"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          アカウントをお持ちでないですか？{" "}
          <button
            onClick={onRegisterClick}
            className="text-primary hover:underline focus:outline-none"
          >
            新規登録
          </button>
        </p>
      </div>
    </div>
  );
}
