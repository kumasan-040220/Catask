"use client";

import { useState } from "react";
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
  const { login, error, isLoading } = useAuth();

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">ログイン</h2>

      {error && (
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
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="パスワード"
            required
          />
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
