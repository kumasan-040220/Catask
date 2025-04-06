"use client";

import { useState, useEffect } from "react";
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
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [displayError, setDisplayError] = useState(true);
  // メール認証関連の状態
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    error,
    isLoading,
    verifyUserEmail,
    resendVerificationCode,
  } = useAuth();

  // 初期化時にローカルストレージから状態を復元
  useEffect(() => {
    try {
      // ローカルストレージから認証情報を取得
      const savedEmail = localStorage.getItem("verification_email");
      const showVerification =
        localStorage.getItem("show_verification_form") === "true";

      console.log("初期化時の認証情報:", { savedEmail, showVerification });

      if (savedEmail) {
        setVerificationEmail(savedEmail);
      }

      if (showVerification) {
        console.log("ローカルストレージから認証フォーム表示状態を復元");
        setShowVerificationForm(true);
      }
    } catch (error) {
      console.error("ローカルストレージからの読み込みエラー:", error);
    }
  }, []);

  // メールアドレスのバリデーション
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(email.trim() !== "" && emailRegex.test(email));
  }, [email]);

  // フォームエラーを3秒後に消す
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (formError || error) {
      timeoutId = setTimeout(() => {
        setDisplayError(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [formError, error]);

  // エラーが変わったらdisplayErrorをtrueにリセット
  useEffect(() => {
    setDisplayError(true);
  }, [formError, error]);

  // 再送信成功メッセージを3秒後に消す
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (resendSuccess) {
      timeoutId = setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [resendSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setDisplayError(true);

    // 入力検証
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setFormError("すべてのフィールドを入力してください");
      return;
    }

    // 利用規約同意の確認
    if (!termsAgreed) {
      setFormError("利用規約とプライバシーポリシーに同意する必要があります");
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

    try {
      console.log("登録開始:", email);
      const result = await register(email, password);
      console.log("登録結果:", JSON.stringify(result));

      if (result.success) {
        console.log("登録成功: 認証フォームに切り替えます");

        // 認証メール用の状態を設定
        setVerificationEmail(email);

        // ローカルストレージに保存して、ページリロード後も認証フォームを表示
        try {
          localStorage.setItem("verification_email", email);
          localStorage.setItem("show_verification_form", "true");
          console.log("認証情報をローカルストレージに保存");
        } catch (error) {
          console.error("ローカルストレージ保存エラー:", error);
        }

        // UIを更新
        setShowVerificationForm(true);
        console.log("認証フォーム表示状態を設定:", true);

        if (!result.needsVerification) {
          // 認証不要の場合は直接成功
          console.log("認証不要のため直接ダッシュボードに移動します");
          clearVerificationStorage();
          onSuccess();
        }
      } else {
        // エラーメッセージがある場合は表示
        if (result.message) {
          setFormError(result.message);
        } else {
          setFormError("登録に失敗しました。もう一度お試しください。");
        }
      }
    } catch (error) {
      console.error("登録処理中にエラーが発生しました:", error);
      setFormError("登録中にエラーが発生しました。もう一度お試しください。");
    }
  };

  // 認証完了時のローカルストレージクリア関数
  const clearVerificationStorage = () => {
    try {
      localStorage.removeItem("verification_email");
      localStorage.removeItem("show_verification_form");
      console.log("認証情報をローカルストレージから削除");
    } catch (error) {
      console.error("ローカルストレージ削除エラー:", error);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setDisplayError(true);

    if (!verificationCode.trim()) {
      setFormError("認証コードを入力してください");
      return;
    }

    const success = await verifyUserEmail(verificationEmail, verificationCode);
    if (success) {
      clearVerificationStorage();
      onSuccess();
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setFormError("");
    setDisplayError(true);

    const success = await resendVerificationCode(verificationEmail);
    if (success) {
      setResendSuccess(true);
    }

    setIsResending(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const isFormValid =
    termsAgreed &&
    isEmailValid &&
    password.trim().length >= 6 &&
    confirmPassword.trim() &&
    password === confirmPassword;

  // ログインフォームに戻る際にローカルストレージをクリア
  const handleBackToLogin = () => {
    clearVerificationStorage();
    onLoginClick();
  };

  // コードを読みやすくするため、レンダリングロジックを別の関数に分離
  const renderRegisterForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">アカウント登録</h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-700 text-sm">
          <span className="font-bold">登録の流れ:</span>
          <br />
          1. メールアドレスとパスワードを入力（仮登録）
          <br />
          2. 認証コードをメールで受け取る
          <br />
          3. 認証コードを入力して本登録完了
        </p>
      </div>

      {displayError && (formError || error) && (
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
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 
              ${
                email.trim() && !isEmailValid
                  ? "border-red-500 focus:ring-red-500"
                  : "focus:ring-primary"
              }`}
            placeholder="your@email.com"
            autoComplete="email"
            required
          />
          {email.trim() && !isEmailValid && (
            <p className="text-red-500 text-xs mt-1">
              有効なメールアドレスを入力してください
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary
                ${
                  password.trim() && password.length < 6 ? "border-red-500" : ""
                }`}
              placeholder="6文字以上"
              autoComplete="new-password"
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
          {password.trim() && password.length < 6 && (
            <p className="text-red-500 text-xs mt-1">
              パスワードは6文字以上である必要があります
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
            パスワード（確認）
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary
                ${
                  confirmPassword.trim() && password !== confirmPassword
                    ? "border-red-500"
                    : ""
                }`}
              placeholder="パスワードを再入力"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? "非表示" : "表示"}
            </button>
          </div>
          {confirmPassword.trim() && password !== confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              パスワードが一致しません
            </p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="w-4 h-4 border rounded focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-700">
                <span>
                  <b>利用規約とプライバシーポリシー</b>に同意します。
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                ※入力されたタスクの内容はサーバー上で平文（暗号化されていない状態）で保存され、
                システム管理者や開発者がメンテナンス目的で閲覧できる可能性があります。
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full ${
            isFormValid
              ? "bg-primary hover:bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          } text-white py-2 px-4 rounded transition-colors`}
          disabled={isLoading || !isFormValid}
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

  const renderVerificationForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        メールアドレスの認証
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-700 text-sm">
          <span className="font-bold">仮登録が完了しました。</span>
          <br />
          あと一歩でアカウント作成が完了します。メールに送信された認証コードを入力してください。
        </p>
      </div>

      <p className="mb-4 text-gray-700">
        {verificationEmail}{" "}
        宛に認証コードを送信しました。メールに記載されたコードを入力してアカウントを有効化してください。
      </p>

      {displayError && formError && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          認証コードを再送信しました。メールをご確認ください。
        </div>
      )}

      <form onSubmit={handleVerifySubmit}>
        <div className="mb-6">
          <label
            htmlFor="verificationCode"
            className="block text-gray-700 mb-2"
          >
            認証コード
          </label>
          <input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="6桁のコードを入力"
            maxLength={6}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-primary mb-4 transition"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              認証中...
            </span>
          ) : (
            "認証する"
          )}
        </button>

        <div className="text-center mb-4">
          <button
            type="button"
            onClick={handleResendCode}
            className="text-primary hover:text-primary-dark focus:outline-none text-sm transition"
            disabled={isResending}
          >
            {isResending ? "送信中..." : "認証コードを再送信する"}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 focus:outline-none text-sm transition"
          >
            ログイン画面に戻る
          </button>
        </div>
      </form>
    </div>
  );

  // 表示するコンポーネントを条件分岐
  console.log(
    "現在のフォーム表示状態:",
    showVerificationForm ? "認証コード入力" : "登録"
  );
  if (showVerificationForm) {
    console.log("認証コード入力フォームをレンダリングします");
    // 認証コード入力フォーム
    return renderVerificationForm();
  }

  // 通常の登録フォームを表示
  return renderRegisterForm();
}
