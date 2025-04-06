"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
}

export default function RegisterForm({
  onSuccess,
  onLoginClick,
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const { register, error, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    // 入力検証
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setFormError("すべてのフィールドを入力してください");
      return;
    }

    // パスワードの一致を確認
    if (password !== confirmPassword) {
      setFormError("パスワードが一致しません");
      return;
    }

    // メールアドレスの形式を検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("有効なメールアドレスを入力してください");
      return;
    }

    // パスワードの長さを検証
    if (password.length < 6) {
      setFormError("パスワードは6文字以上である必要があります");
      return;
    }

    const success = await register(email, password);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">アカウント登録</h2>

      {(formError || error) && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError || error}
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

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="6文字以上"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="パスワードを再入力"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "登録中..." : "登録する"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          既にアカウントをお持ちですか？{" "}
          <button
            onClick={onLoginClick}
            className="text-primary hover:underline focus:outline-none"
          >
            ログイン
          </button>
        </p>
      </div>
    </div>
  );
}
