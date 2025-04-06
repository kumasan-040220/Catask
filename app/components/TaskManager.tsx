"use client";

import { useState, useEffect } from "react";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import TaskFilterComponent from "./TaskFilter";
import PointAnimation from "./PointAnimation";
import { Task, TaskFilter, CatStatusType } from "../utils/types";
import { createTask } from "../utils/taskUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCatStatus } from "@/app/providers/CatStatusProvider";
import { updateUserPoints as apiUpdateUserPoints } from "@/app/utils/apiClient";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>(TaskFilter.ACTIVE);
  const [isLoading, setIsLoading] = useState(true);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { user, isLoading: authLoading, updatePoints } = useAuth();
  const { setCatStatus } = useCatStatus();

  // ユーザーのタスクを読み込む
  useEffect(() => {
    console.log("ユーザー情報が更新されました:", user);
    if (user) {
      if (user.tasks && Array.isArray(user.tasks)) {
        console.log("タスクを読み込みます:", user.tasks.length);
        // 日付文字列をDateオブジェクトに変換
        const formattedTasks = user.tasks.map((task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
        }));
        setTasks(formattedTasks);
      } else {
        console.log("タスクが存在しないか配列ではありません");
        setTasks([]);
      }
      setIsLoading(false);
    }
  }, [user]);

  // タスクをサーバーに保存する
  const saveTasksToServer = async (updatedTasks: Task[]) => {
    if (!user) return;
    setIsSaving(true);
    console.log("タスクをサーバーに保存します:", updatedTasks.length);

    try {
      const response = await fetch("/api/tasks/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("タスク保存エラー:", errorData);
        throw new Error(errorData.message || "タスクの保存に失敗しました");
      }

      const result = await response.json();
      console.log("タスク保存結果:", result);
    } catch (error) {
      console.error("タスクの保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ポイントを更新する
  const updateUserPoints = async (points: number) => {
    if (!user) return;

    try {
      // APIクライアントを使用してポイントを更新
      const result = await apiUpdateUserPoints(points);

      if (!result.success) {
        throw new Error("ポイントの更新に失敗しました");
      }

      // AuthProviderのupdatePointsを使用してUIを更新
      updatePoints(points);

      // 成功したらコンソールに記録
      console.log("ポイントを更新しました:", points);
    } catch (error) {
      console.error("ポイント更新エラー:", error);
    }
  };

  // タスクが変更されたら保存
  useEffect(() => {
    // isLoadingとauthLoadingがfalseでuserがある場合のみタスクを保存
    if (!isLoading && !authLoading && user && tasks.length >= 0) {
      console.log("タスク変更を検出 - 保存します:", tasks.length);
      saveTasksToServer(tasks);
    }
  }, [tasks, isLoading, authLoading, user]);

  // タスク追加
  const handleAddTask = (
    title: string,
    estimatedTime: number,
    dueDate: Date | null
  ) => {
    const newTask = createTask(title, estimatedTime, dueDate);
    setTasks([...tasks, newTask]);
    // タスク追加後にActiveフィルターを設定
    setFilter(TaskFilter.ACTIVE);
  };

  // タスク完了状態の切り替え
  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const isCompleting = task && !task.completed;

    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );

    // タスクが完了状態になる場合のみポイントを加算
    if (isCompleting && user) {
      const newPoints = (user.points || 0) + 1;
      console.log("タスク完了 - ポイント加算:", user.points, "→", newPoints);
      updateUserPoints(newPoints);
      setShowPointAnimation(true);

      // 猫のステータスを「嬉しい」に変更
      setCatStatus(CatStatusType.HAPPY);

      // 30秒後に猫のステータスをランダムに戻す
      setTimeout(() => {
        const statusTypes = [
          CatStatusType.NORMAL,
          CatStatusType.HUNGRY,
          CatStatusType.SLEEPY,
          CatStatusType.PLAYFUL,
        ];
        const randomStatus =
          statusTypes[Math.floor(Math.random() * statusTypes.length)];
        setCatStatus(randomStatus);
      }, 30000);
    }
  };

  // アニメーション終了時の処理
  const handleAnimationEnd = () => {
    setShowPointAnimation(false);
  };

  // タスク削除
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // すべてのタスクを削除
  const handleClearCompletedTasks = () => {
    setTasks(tasks.filter((task) => !task.completed));
  };

  // タスク数のカウント
  const taskCount = {
    all: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  };

  // 合計見積時間
  const totalEstimatedTime = tasks.reduce(
    (total, task) => total + task.estimatedTime,
    0
  );
  // 未完了タスクの合計見積時間
  const activeEstimatedTime = tasks
    .filter((task) => !task.completed)
    .reduce((total, task) => total + task.estimatedTime, 0);

  // 期限切れのタスク数
  const overdueTasksCount = tasks.filter(
    (task) => !task.completed && task.dueDate && new Date() > task.dueDate
  ).length;

  // パネルの開閉を切り替え
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // パネルを閉じる
  const closePanel = () => {
    setIsPanelOpen(false);
  };

  // ローディング状態の処理
  if (authLoading) {
    console.log("認証中...");
    return <div className="text-center p-4">認証情報を読み込み中...</div>;
  }

  if (isLoading) {
    console.log("タスクデータ読み込み中...");
    return <div className="text-center p-4">タスクデータを読み込み中...</div>;
  }

  if (!user) {
    console.log("ユーザーが見つかりません");
    return <div className="text-center p-4">ユーザー情報が見つかりません</div>;
  }

  return (
    <>
      {/* 背景オーバーレイ（パネルが開いている時のみ表示） */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-30 z-40 "
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      <div className="fixed top-0 right-0 h-full z-50 flex">
        {/* パネル左側の開閉用オーバーレイ - パネルの状態によって位置が変わる */}
        <div
          className={`w-[50px] h-full cursor-pointer ${
            isPanelOpen ? "" : "absolute right-0 transform"
          }`}
          onClick={togglePanel}
          aria-label={
            isPanelOpen ? "タスクパネルを閉じる" : "タスクパネルを開く"
          }
        >
          {/* 視覚的なインジケーターなし - 透明なオーバーレイのみ */}
          <div
            className={`h-full bg-gray-400 transition-all duration-30 ease-in-out ${
              isPanelOpen
                ? "bg-opacity-30 hover:bg-opacity-40"
                : "bg-opacity-10 hover:bg-opacity-20"
            }`}
          ></div>
        </div>

        {/* パネル本体 */}
        <div
          className={`bg-white shadow-lg transition-all duration-30 ease-in-out w-full max-w-md sm:max-w-sm md:max-w-md h-full overflow-y-auto
                    ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">タスク管理</h1>
              <div className="flex items-center gap-2">
                <div className="bg-primary text-white px-3 py-1 rounded-full flex items-center">
                  <span className="font-bold">{user?.points || 0}</span>
                  <span className="ml-1 text-sm">ポイント</span>
                </div>
                <button
                  onClick={closePanel}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                  aria-label="閉じる"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <TaskForm onAdd={handleAddTask} />

            {totalEstimatedTime > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                <div>合計見積時間: {totalEstimatedTime}分</div>
                <div>残り見積時間: {activeEstimatedTime}分</div>
              </div>
            )}

            {overdueTasksCount > 0 && (
              <div className="mb-4 p-2 bg-red-50 border border-red-300 rounded text-red-600 text-sm">
                <strong>注意:</strong> {overdueTasksCount}
                件のタスクが期限切れです
              </div>
            )}

            <TaskFilterComponent
              currentFilter={filter}
              onFilterChange={setFilter}
              taskCount={taskCount}
            />

            <TaskList
              tasks={tasks}
              filter={filter}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />

            {taskCount.completed > 0 && (
              <div className="mt-4 text-right">
                <button
                  onClick={handleClearCompletedTasks}
                  className="text-sm text-gray-500 hover:text-danger underline"
                >
                  完了したタスクを削除
                </button>
              </div>
            )}

            {showPointAnimation && (
              <PointAnimation show={true} onAnimationEnd={handleAnimationEnd} />
            )}

            {isSaving && (
              <div className="text-sm text-gray-500 mt-4 text-center">
                変更を保存中...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
