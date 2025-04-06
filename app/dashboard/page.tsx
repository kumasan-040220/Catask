"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskManager from "@/app/components/TaskManager";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCatStatus } from "@/app/providers/CatStatusProvider";
import CatStatus from "@/app/components/CatStatus";
import CatNameForm from "@/app/components/CatNameForm";
import ItemShop from "../components/ItemShop";
import ItemInventory from "../components/ItemInventory";

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading, logout, deleteAccount } = useAuth();
  const { isNameSet } = useCatStatus();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showNameForm, setShowNameForm] = useState(false);

  useEffect(() => {
    // ログインしていない場合は認証ページにリダイレクト
    if (!isLoading && !user) {
      router.push("/auth");
    }

    // 名前が設定されていなければフォームを表示
    setShowNameForm(!isNameSet);
  }, [user, isLoading, router, isNameSet]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  const handleShowDeleteConfirm = () => {
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteAccount();

      if (result.success) {
        router.push("/auth");
      } else {
        setDeleteError(result.message || "アカウントの削除に失敗しました");
      }
    } catch (error) {
      setDeleteError("エラーが発生しました。再度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  };

  // 猫の名前設定完了時の処理
  const handleNameComplete = () => {
    setShowNameForm(false);
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

  if (!user) {
    return null; // useEffectがリダイレクトするまで何も表示しない
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Catask</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              <span className="text-gray-600">ポイント: </span>
              <span className="text-primary">{user.points || 0}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors"
            >
              ログアウト
            </button>
            <button
              onClick={handleShowDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              アカウント削除
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showNameForm ? (
          <div className="mb-8">
            <CatNameForm
              onComplete={handleNameComplete}
              className="max-w-md mx-auto"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1">
              <div>
                <TaskManager />
              </div>
              <div>
                <CatStatus className="w-full" />
              </div>
            </div>

            <div className="mt-8">
              <ItemInventory />
            </div>

            <div className="mt-8">
              <ItemShop />
            </div>
          </>
        )}
      </main>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">アカウント削除の確認</h3>

            <p className="text-gray-700 mb-6">
              アカウントを削除すると、すべてのデータが完全に削除され、元に戻すことはできません。本当に削除しますか？
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                disabled={isDeleting}
              >
                キャンセル
              </button>

              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
