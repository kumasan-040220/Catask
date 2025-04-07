"use client";

import { useState, useEffect, useRef } from "react";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import TaskFilterComponent from "./TaskFilter";
import PointAnimation from "./PointAnimation";
import { Task, TaskFilter, CatStatusType } from "../utils/types";
import { createTask } from "../utils/taskUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCatStatus } from "@/app/providers/CatStatusProvider";
import { updateUserPoints as apiUpdateUserPoints } from "@/app/utils/apiClient";
import { v4 as uuidv4 } from "uuid";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>(TaskFilter.ACTIVE);
  const [isLoading, setIsLoading] = useState(true);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [operationStates, setOperationStates] = useState({
    toggleTask: false,
    addTask: false,
    deleteTask: false,
    clearCompleted: false,
  });
  const {
    user,
    isLoading: authLoading,
    updatePoints,
    refreshUser,
    forceRefresh,
  } = useAuth();
  const { setCatStatus } = useCatStatus();

  // useRefをコンポーネントのトップレベルに移動
  const lastTasksRef = useRef<string>(JSON.stringify([]));
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 既に完了済みのタスクIDを記録するための参照
  const completedTaskIdsRef = useRef<Set<string>>(new Set());
  const autoDeleteInProgressRef = useRef<boolean>(false);

  // タスクデータの整合性を検証する関数
  const validateTasksData = (tasksData: Task[]) => {
    if (!Array.isArray(tasksData)) {
      console.error("タスクデータが配列ではありません");
      return {
        allTasks: [],
        completedTaskIds: new Set<string>(),
        newlyCompletedTaskIds: new Set<string>(),
      };
    }

    console.log("タスクデータの整合性を検証します");

    // IDによる重複排除（同じIDのタスクが複数ある場合、最初のものだけを残す）
    const uniqueTasks = removeDuplicateTasks(tasksData);

    if (uniqueTasks.length !== tasksData.length) {
      console.warn(
        `重複タスクを検出しました: 重複排除前=${tasksData.length}件, 重複排除後=${uniqueTasks.length}件`
      );
    }

    // 完了済みタスクのIDを設定
    const currentCompletedTaskIds = new Set<string>();

    uniqueTasks.forEach((task) => {
      if (task.completed) {
        currentCompletedTaskIds.add(task.id);
      }
    });

    // 前回の完了タスクと比較して、新しく完了したタスクを特定
    const newlyCompletedTaskIds = new Set<string>();

    currentCompletedTaskIds.forEach((id) => {
      if (!completedTaskIdsRef.current.has(id)) {
        newlyCompletedTaskIds.add(id);
      }
    });

    // 検証結果をログに出力
    console.log(
      `検証結果: 全タスク ${uniqueTasks.length}件, 完了タスク ${currentCompletedTaskIds.size}件, 新規完了タスク ${newlyCompletedTaskIds.size}件`
    );

    // 参照を更新
    completedTaskIdsRef.current = currentCompletedTaskIds;

    return {
      allTasks: uniqueTasks,
      completedTaskIds: currentCompletedTaskIds,
      newlyCompletedTaskIds,
    };
  };

  // IDによる重複タスクの排除
  const removeDuplicateTasks = (tasks: Task[]): Task[] => {
    // IDを表すMapを使って、同じIDのタスクは上書きされる
    const uniqueTasksMap = new Map<string, Task>();

    tasks.forEach((task) => {
      if (task && task.id) {
        if (uniqueTasksMap.has(task.id)) {
          console.log(
            `重複タスクを検出: ID=${task.id}, タイトル=${task.title}`
          );
        }
        uniqueTasksMap.set(task.id, task);
      }
    });

    // Mapから配列に戻す
    return Array.from(uniqueTasksMap.values());
  };

  // ユーザーのタスクを読み込む
  useEffect(() => {
    console.log("ユーザー情報が更新されました:", user);
    if (user) {
      if (user.tasks && Array.isArray(user.tasks)) {
        try {
          console.log(`ユーザー ${user.id} のタスクを読み込みます`);

          // タスクデータを処理して暗号化されたタイトルがないか確認
          const formattedTasks = user.tasks.map((task: any) => {
            try {
              let taskTitle = task.title;

              // 暗号化されたタイトルを検出する（16進数:16進数の形式をチェック）
              if (
                typeof taskTitle === "string" &&
                taskTitle.includes(":") &&
                taskTitle.split(":")[0].length === 32 &&
                /^[0-9a-f]+$/.test(taskTitle.split(":")[0])
              ) {
                console.warn(
                  `暗号化されたタイトルを検出: "${taskTitle.substring(
                    0,
                    20
                  )}..."`
                );

                // 緊急対応：暗号化されたタイトルには「[暗号化]」というプレフィックスを付ける
                taskTitle = `[暗号化] ${taskTitle.substring(0, 10)}...`;

                // 再度データの再取得をトリガーするためのフラグを設定
                setTimeout(() => {
                  console.log(
                    "暗号化されたタイトルが検出されたため、データを再取得します"
                  );
                  forceRefresh();
                }, 3000);
              }

              return {
                id: task.id,
                title: taskTitle,
                estimatedTime: task.estimatedTime,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                createdAt: new Date(task.createdAt || new Date()),
                completed: Boolean(task.completed),
              };
            } catch (e) {
              console.error("タスク変換エラー:", e);
              return {
                id: task.id || uuidv4(),
                title: task.title || "無題のタスク",
                estimatedTime: task.estimatedTime || null,
                createdAt: new Date(),
                dueDate: null,
                completed: Boolean(task.completed),
              };
            }
          });

          setTasks(formattedTasks);
          setIsLoading(false);
        } catch (err) {
          console.error("タスク読み込みエラー:", err);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // ユーザーIDが変わった時のみ実行、または特定のフラグが変更された時

  // アプリ起動時に確実にユーザー情報を最新化
  useEffect(() => {
    const initialLoad = async () => {
      if (user && !isLoading) {
        console.log("初期ロード: ユーザー情報の確認を開始");

        // タスクデータが存在しない場合のみ再取得を試みる
        if (
          !user.tasks ||
          !Array.isArray(user.tasks) ||
          user.tasks.length === 0
        ) {
          console.log(
            "初期ロード: タスクデータが不足しているため再取得を試みます"
          );
          try {
            // 直接フォースリフレッシュを行う
            await forceRefresh();
            console.log("初期ロード: データの強制リフレッシュが完了しました");
          } catch (error) {
            console.error("初期データ読み込みエラー:", error);
          }
        } else {
          console.log(
            "初期ロード: 既存のタスクデータが見つかりました:",
            user.tasks.length
          );
        }
      }
    };

    initialLoad();

    // タスクデータの確認用タイマー（デバッグ用）
    const checkDataTimer = setTimeout(() => {
      if (user && tasks.length === 0 && user.tasks && user.tasks.length > 0) {
        console.log(
          "警告: ユーザーにタスクデータがあるのに、UIに表示されていません"
        );
        console.log("ユーザータスク:", user.tasks);
        console.log("表示タスク:", tasks);
      }
    }, 3000);

    return () => clearTimeout(checkDataTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回のみ実行

  // 手動でタスクリストを更新する関数を追加
  const forceRefreshTasks = async () => {
    if (user && user.tasks && Array.isArray(user.tasks)) {
      try {
        // refreshUserを呼び出さないように修正
        console.log(
          "タスクの手動更新 - refreshUserは呼び出さない:",
          user.tasks.length
        );

        // タスクデータの詳細をログ出力
        console.log(
          "読み込まれたタスク（生データ）:",
          JSON.stringify(user.tasks).substring(0, 200) + "..."
        );

        // 日付文字列をDateオブジェクトに変換
        const formattedTasks = user.tasks.map((task) => {
          try {
            const formattedTask = {
              ...task,
              // 日付の変換を安全に行う
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              // completedを確実にbooleanにする
              completed: Boolean(task.completed),
            };
            return formattedTask;
          } catch (err) {
            console.error("タスクの日付変換エラー:", err, task);
            // エラーが発生した場合でもタスクを保持するための最低限の処理
            return {
              ...task,
              createdAt: new Date(),
              dueDate: null,
              completed: Boolean(task.completed),
            };
          }
        });

        console.log("変換後のタスク:", formattedTasks.length);
        setTasks(formattedTasks);
        setIsLoading(false);
        console.log("タスクの手動更新が完了しました");
      } catch (err) {
        console.error("タスク全体の手動更新中にエラー:", err);
      }
    }
  };

  // ユーザー情報更新時にタスクも更新
  useEffect(() => {
    // refreshUser()の呼び出しによって再度ユーザー情報が更新され、無限ループになる可能性があるため条件を追加
    if (user && !isLoading) {
      console.log("ユーザー情報の更新を検出 - タスク再読み込み");
      // ここで、forceRefreshTasksがrefreshUserを呼び出さないようにする
      if (user.tasks && Array.isArray(user.tasks)) {
        try {
          console.log("タスクの読み込みを開始:", user.tasks.length);

          // 日付文字列をDateオブジェクトに変換
          const formattedTasks = user.tasks.map((task) => {
            try {
              return {
                ...task,
                createdAt: task.createdAt
                  ? new Date(task.createdAt)
                  : new Date(),
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                completed: Boolean(task.completed),
              };
            } catch (err) {
              console.error("タスク変換エラー:", err);
              return {
                ...task,
                createdAt: new Date(),
                dueDate: null,
                completed: Boolean(task.completed),
              };
            }
          });

          setTasks(formattedTasks);
          setIsLoading(false);

          // 完了済みタスクの有無をチェック
          const hasCompletedTasks = formattedTasks.some(
            (task) => task.completed
          );
          if (hasCompletedTasks) {
            console.log(
              "完了済みタスクが見つかりました - 自動削除を実行します"
            );
            // 少し遅延を入れて自動削除を実行（UIの描画後）
            setTimeout(() => {
              handleClearCompletedTasksQuietly();
            }, 2000);
          }
        } catch (err) {
          console.error("タスク読み込みエラー:", err);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // ユーザーIDが変わった時のみ実行、または特定のフラグが変更された時

  // 完了済みタスクの自動削除機能
  useEffect(() => {
    // タスクが読み込み済みで、完了済みタスクがある場合のみ実行
    if (!isLoading && tasks.length > 0) {
      const hasCompletedTasks = tasks.some((task) => task.completed);
      if (hasCompletedTasks) {
        console.log("完了済みタスクが見つかりました - 自動削除を実行します");

        // 自動削除が既に実行中でないことを確認
        if (!autoDeleteInProgressRef.current) {
          autoDeleteInProgressRef.current = true;

          // 遅延時間を短くして自動削除を実行（UIのちらつきを減らす）
          setTimeout(() => {
            handleClearCompletedTasksQuietly().finally(() => {
              autoDeleteInProgressRef.current = false;
            });
          }, 500); // 2000msから500msに短縮
        } else {
          console.log("自動削除は既に実行中です - スキップします");
        }
      }
    }
  }, [tasks, isLoading]); // tasksが変更されたときに実行

  // 完了済みタスクを静かに削除（通知なし）- パフォーマンス改善版
  const handleClearCompletedTasksQuietly = async () => {
    try {
      console.log("完了済みタスクの自動削除を実行します");

      // 削除前のタスク数を記録
      const beforeTaskCount = tasks.length;
      const completedTaskCount = tasks.filter((task) => task.completed).length;

      // 完了済みタスクがない場合は処理を終了
      if (completedTaskCount === 0) {
        console.log("完了済みタスクはありません");
        return;
      }

      console.log(
        `完了タスクの削除を開始: 全${beforeTaskCount}件中${completedTaskCount}件が完了済み`
      );

      // 未完了タスクのみを含む新しい配列を作成（ちらつき防止のためローディング状態にしない）
      const updatedTasks = tasks.filter((task) => !task.completed);

      // 重複チェック（念のため）
      const uniqueTasks = removeDuplicateTasks(updatedTasks);

      // UIを一度だけ更新してちらつきを防止
      setTasks(uniqueTasks);

      // サーバーに保存
      const saveResult = await saveTasks(uniqueTasks);

      if (saveResult?.success) {
        console.log(
          `完了済みタスクが正常に削除されました: ${completedTaskCount}件削除完了`
        );

        // 完了済みタスクの記録をクリア
        completedTaskIdsRef.current = new Set<string>();
      } else {
        console.error("完了タスク削除の保存に失敗しました:", saveResult?.error);
        // エラー時でもUIの再更新はせず、ユーザー操作を妨げない
      }
    } catch (error) {
      console.error("完了タスク自動削除中にエラーが発生しました:", error);
    }
  };

  // 完了済みタスクの一括削除（UI用）
  const handleClearCompletedTasks = async () => {
    try {
      // ローディング状態を開始
      setOperationStates((prev) => ({ ...prev, clearCompleted: true }));

      // 削除前のタスク数を記録
      const beforeTaskCount = tasks.length;
      const completedTaskCount = tasks.filter((task) => task.completed).length;
      console.log(
        `完了タスクの削除を開始: 全${beforeTaskCount}件中${completedTaskCount}件が完了済み`
      );

      // タスク削除前のバックアップ
      const originalTasks = [...tasks];

      // 完了済みタスクを除外
      const updatedTasks = tasks.filter((task) => !task.completed);

      // 重複チェック（念のため）
      const uniqueTasks = removeDuplicateTasks(updatedTasks);
      if (uniqueTasks.length !== updatedTasks.length) {
        console.warn(
          `完了タスク削除時に重複を検出し、${
            updatedTasks.length - uniqueTasks.length
          }件排除しました`
        );
      }

      // UIを更新
      setTasks(uniqueTasks);

      // サーバーに保存
      const saveResult = await saveTasks(uniqueTasks);

      if (!saveResult?.success) {
        // エラーが発生した場合、UIを元に戻す
        console.error("完了タスク削除の保存に失敗しました:", saveResult?.error);
        setTasks(originalTasks); // 元のタスクリストに戻す
      } else {
        console.log(
          `完了済みタスクが正常に削除されました: ${completedTaskCount}件削除完了`
        );

        // 完了済みタスクの記録をクリア
        const newCompletedTaskIds = new Set<string>();
        uniqueTasks.forEach((task) => {
          if (task.completed) {
            newCompletedTaskIds.add(task.id);
          }
        });
        completedTaskIdsRef.current = newCompletedTaskIds;

        if (newCompletedTaskIds.size > 0) {
          console.warn(
            `完了タスク削除後も${newCompletedTaskIds.size}件の完了タスクが残っています`
          );
        }
      }
    } catch (error) {
      console.error("完了タスク削除中にエラーが発生しました:", error);
    } finally {
      // ローディング状態を終了
      setOperationStates((prev) => ({ ...prev, clearCompleted: false }));
    }
  };

  // タスクをサーバーに保存する
  const saveTasks = async (tasksToSave: Task[]) => {
    if (!Array.isArray(tasksToSave)) {
      console.error("saveTasks: 無効なタスクデータです:", tasksToSave);
      return {
        success: false,
        error: "無効なタスクデータです",
      };
    }

    // 保存前に重複を排除
    const uniqueTasks = removeDuplicateTasks(tasksToSave);

    // 重複があった場合のログ出力
    if (uniqueTasks.length !== tasksToSave.length) {
      console.warn(
        `saveTasks: ${
          tasksToSave.length - uniqueTasks.length
        }件の重複タスクを排除しました`
      );

      // 重複していたタスクのIDを出力（デバッグ用）
      const uniqueIds = new Set(uniqueTasks.map((task) => task.id));
      const duplicateIds = tasksToSave
        .filter(
          (task) =>
            !uniqueIds.has(task.id) ||
            tasksToSave.filter((t) => t.id === task.id).length > 1
        )
        .map((task) => task.id);

      if (duplicateIds.length > 0) {
        console.warn(
          "重複していたタスクID:",
          Array.from(new Set(duplicateIds))
        );
      }
    }

    setIsSaving(true);
    console.log(
      `タスクの保存を開始します - 元の件数: ${tasksToSave.length}, 重複排除後: ${uniqueTasks.length}`
    );

    try {
      // ユーザーが存在し、認証されているか確認
      if (!user || authLoading) {
        console.log(
          "ユーザーが認証されていない、または読み込み中のためタスクを保存できません"
        );
        setIsSaving(false);
        return {
          success: false,
          error: "ユーザーが認証されていないか、読み込み中です",
        };
      }

      // 保存前にタスク完了状態を確認（デバッグ用）
      const completedTasks = uniqueTasks.filter((task) => task.completed);
      console.log(
        `保存するタスク: ${uniqueTasks.length}件, 完了タスク: ${completedTasks.length}件`
      );

      // タスクごとに完了状態を確認
      completedTasks.forEach((task) => {
        console.log(
          `完了タスク: ${task.title}, ID: ${task.id}, 完了状態: ${task.completed}`
        );
      });

      // saveTasksToServerの代わりに直接fetchを使用
      const response = await fetch("/api/tasks/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: uniqueTasks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("タスク保存エラー:", errorData);
        console.error(
          "タスクの保存中にエラーが発生しました:",
          errorData.message || "タスクの保存に失敗しました"
        );
        return {
          success: false,
          error: errorData.message || "タスクの保存に失敗しました",
        };
      } else {
        const result = await response.json();
        console.log("タスクが正常に保存されました", result);

        // 保存が成功したら、タスクリストの整合性を再度確認
        const validatedData = validateTasksData(uniqueTasks);

        // UIに表示されているタスクも更新して整合性を保つ
        if (result.success) {
          // 明示的にタスクリストを更新して整合性を保つ
          setTasks(validatedData.allTasks);
        }

        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      console.error("タスク保存中に例外が発生しました:", error);
      return {
        success: false,
        error: "タスク保存中に例外が発生しました",
      };
    } finally {
      setIsSaving(false);
    }
  };

  // ポイントを更新する
  const updateUserPoints = async (points: number) => {
    if (!user) return;

    try {
      console.log(`ポイント更新API呼び出し: ${points}ポイントに設定します`);

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

  // タスク変更時の自動保存処理 - デバウンス対応
  useEffect(() => {
    // useRefをここで宣言するのではなく、上で宣言した参照を使用

    // isLoadingとauthLoadingがfalseでuserがある場合のみタスクを保存
    if (!isLoading && !authLoading && user && tasks.length >= 0) {
      // ディープな変更検出のためにJSON文字列化して比較
      const currentTasks = JSON.stringify(tasks);
      if (lastTasksRef.current !== currentTasks) {
        console.log("タスク変更を検出 - 保存をスケジュール:", tasks.length);

        // 直前の保存処理をキャンセル
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        // 500ms後に保存処理を実行（デバウンス）
        saveTimeoutRef.current = setTimeout(() => {
          console.log("デバウンス後のタスク保存を実行:", tasks.length);
          saveTasks(tasks);
          lastTasksRef.current = currentTasks;
        }, 500);
      }
    }

    // クリーンアップ関数
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [tasks, isLoading, authLoading, user]);

  // タスク追加
  const handleAddTask = async (
    title: string,
    estimatedTime: number,
    dueDate: Date | null
  ) => {
    try {
      // ローディング状態を開始
      setOperationStates((prev) => ({ ...prev, addTask: true }));

      const newTask = createTask(title, estimatedTime, dueDate);
      console.log(
        `新しいタスクを作成しました: ID=${newTask.id}, タイトル=${title}`
      );

      // 現在のタスクリストをバックアップ（エラー時の復元用）
      const originalTasks = [...tasks];

      // 新しいタスクを追加（この時点ではまだ重複がある可能性あり）
      const updatedTasks = [...tasks, newTask];

      // 重複チェックを行う
      const uniqueTasks = removeDuplicateTasks(updatedTasks);
      if (uniqueTasks.length !== updatedTasks.length) {
        console.warn(
          `タスク追加時に重複を検出し、${
            updatedTasks.length - uniqueTasks.length
          }件排除しました`
        );
      }

      // 重複排除済みのタスクリストをUIに反映
      setTasks(uniqueTasks);

      // サーバーに保存（重複排除済みリスト）
      const saveResult = await saveTasks(uniqueTasks);

      if (!saveResult?.success) {
        // エラーが発生した場合、UIを元に戻す
        console.error("タスク追加の保存に失敗しました:", saveResult?.error);
        setTasks(originalTasks); // 元のタスクリストに戻す
      } else {
        console.log("新しいタスクが正常に保存されました:", newTask.title);
      }
    } catch (error) {
      console.error("タスク追加中にエラーが発生しました:", error);
    } finally {
      // ローディング状態を終了
      setOperationStates((prev) => ({ ...prev, addTask: false }));
    }
  };

  // タスク完了状態の切り替え
  const toggleTask = async (id: string) => {
    try {
      // ローディング状態を開始
      setOperationStates((prev) => ({ ...prev, toggleTask: true }));

      console.log(`タスク ID:${id} の状態を切り替えます`);

      // 該当タスクを見つける
      const taskIndex = tasks.findIndex((task) => task.id === id);
      if (taskIndex === -1) {
        console.error(`タスク ID:${id} が見つかりません`);
        setOperationStates((prev) => ({ ...prev, toggleTask: false }));
        return;
      }

      // 元のタスクリストをバックアップ（エラー時の復元用）
      const originalTasks = [...tasks];

      // タスクのディープコピーを作成して変更
      const updatedTasks = [...tasks];
      const task = { ...updatedTasks[taskIndex] };
      const wasCompleted = task.completed;
      const taskTitle = task.title;

      // 切り替え前の状態をログに記録
      console.log(
        `タスク「${taskTitle}」の状態変更 - 現在: ${
          wasCompleted ? "完了" : "未完了"
        } → ${!wasCompleted ? "完了" : "未完了"}`
      );

      // タスクの完了状態を切り替え
      task.completed = !task.completed;
      updatedTasks[taskIndex] = task;

      // 重複チェックを実行
      const uniqueTasks = removeDuplicateTasks(updatedTasks);

      try {
        if (!wasCompleted && task.completed) {
          // タスクが完了した場合、完了済みタスクのセットに追加
          completedTaskIdsRef.current.add(id);

          console.log(
            `タスク「${taskTitle}」が完了しました - 削除処理を実行します`
          );

          // 完了状態になったタスクを除外した新しいタスクリスト
          const tasksWithoutCompleted = uniqueTasks.filter(
            (t) => !(t.id === id && t.completed)
          );

          // UIをすぐに更新（完了タスクを表示しない）
          setTasks(tasksWithoutCompleted);

          // サーバーに保存
          const saveResult = await saveTasks(tasksWithoutCompleted);

          if (saveResult?.success) {
            console.log(`完了したタスク「${taskTitle}」が正常に削除されました`);
          } else {
            console.error(
              "完了タスク削除の保存に失敗しました:",
              saveResult?.error
            );
            // エラー時は元のリストに戻す
            setTasks(originalTasks);
          }

          // ポイントの更新処理
          const pointsToAdd = 1;
          setCatStatus(CatStatusType.HAPPY);

          if (user) {
            const newPoints = user.points + pointsToAdd;
            await updateUserPoints(newPoints);

            // 成功したことをUIに表示
            setShowPointAnimation(true);
          }

          // 猫のステータスをランダムに戻すタイマー
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
        } else {
          // 完了→未完了の場合、またはタスクが変更されただけの場合

          // 完了状態から未完了に戻す場合
          if (wasCompleted && !task.completed) {
            // 完了済みタスクのセットから削除
            completedTaskIdsRef.current.delete(id);

            // ポイントを減算
            const pointsToSubtract = 1;
            if (user && user.points >= pointsToSubtract) {
              const newPoints = user.points - pointsToSubtract;
              await updateUserPoints(newPoints);
            }
          }

          // UIを更新
          setTasks(uniqueTasks);

          // サーバーに保存
          await saveTasks(uniqueTasks);
        }
      } catch (error) {
        console.error("タスク状態変更中にエラーが発生しました:", error);
        // エラー発生時は元のタスクリストに戻す
        setTasks(originalTasks);
      } finally {
        // ローディング状態を終了
        setOperationStates((prev) => ({ ...prev, toggleTask: false }));
      }
    } catch (error) {
      console.error("タスク状態の切り替え処理中にエラーが発生しました:", error);
      setOperationStates((prev) => ({ ...prev, toggleTask: false }));
    }
  };

  // アニメーション終了時の処理
  const handleAnimationEnd = () => {
    setShowPointAnimation(false);
  };

  // タスク削除
  const handleDeleteTask = async (id: string) => {
    try {
      // ローディング状態を開始
      setOperationStates((prev) => ({ ...prev, deleteTask: true }));

      console.log(`タスク ID:${id} を削除します`);

      // タスク削除前のバックアップ
      const originalTasks = [...tasks];

      // 削除対象のタスク情報をログに残す（デバッグ用）
      const taskToDelete = tasks.find((task) => task.id === id);
      if (taskToDelete) {
        console.log(
          `削除するタスク: タイトル=${taskToDelete.title}, 完了=${taskToDelete.completed}`
        );
      } else {
        console.warn(`削除対象のタスク ID:${id} が見つかりません`);
      }

      // UIからタスクを削除
      const updatedTasks = tasks.filter((task) => task.id !== id);

      // 重複チェック（念のため）
      const uniqueTasks = removeDuplicateTasks(updatedTasks);
      if (uniqueTasks.length !== updatedTasks.length) {
        console.warn(
          `タスク削除時に重複を検出し、${
            updatedTasks.length - uniqueTasks.length
          }件排除しました`
        );
      }

      // UIを更新
      setTasks(uniqueTasks);

      // サーバーに保存
      const saveResult = await saveTasks(uniqueTasks);

      if (!saveResult?.success) {
        // エラーが発生した場合、UIを元に戻す
        console.error("タスク削除の保存に失敗しました:", saveResult?.error);
        setTasks(originalTasks); // 元のタスクリストに戻す
      } else {
        console.log("タスクが正常に削除されました - ID:", id);

        // 完了済みタスクの記録からも削除
        completedTaskIdsRef.current.delete(id);
      }
    } catch (error) {
      console.error("タスク削除中にエラーが発生しました:", error);
    } finally {
      // ローディング状態を終了
      setOperationStates((prev) => ({ ...prev, deleteTask: false }));
    }
  };

  // タスク数のカウント
  const taskCount = {
    all: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  };

  // デバッグ情報: フィルタリング状態を確認
  console.log(
    `現在のフィルター: ${filter}, 全タスク: ${taskCount.all}, アクティブ: ${taskCount.active}, 完了: ${taskCount.completed}`
  );

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

  // 猫の状態に対応するテキストを取得
  const getCatStatusText = (status: CatStatusType) => {
    switch (status) {
      case CatStatusType.HAPPY:
        return "ご機嫌";
      case CatStatusType.HUNGRY:
        return "お腹すいた";
      case CatStatusType.SLEEPY:
        return "眠い";
      case CatStatusType.PLAYFUL:
        return "遊びたい";
      default:
        return "普通";
    }
  };

  // 猫の状態に対応する画像を取得
  const getCatImageByCatStatus = (status: CatStatusType) => {
    switch (status) {
      case CatStatusType.HAPPY:
        return "/images/cat_happy.png";
      case CatStatusType.HUNGRY:
        return "/images/cat_hungry.png";
      case CatStatusType.SLEEPY:
        return "/images/cat_sleepy.png";
      case CatStatusType.PLAYFUL:
        return "/images/cat_playful.png";
      default:
        return "/images/cat_normal.png";
    }
  };

  // ローディング状態の処理
  if (authLoading) {
    console.log("認証中...");
    return (
      <div className="text-center p-4 flex flex-col items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
        <p>認証情報を読み込み中...</p>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto mb-4"></div>
        タスクデータを読み込み中...
      </div>
    );
  }

  return (
    <div className="h-full">
      {authLoading ? (
        // 認証ローディング表示
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">認証情報を読み込み中...</p>
        </div>
      ) : !user ? (
        // 未認証表示
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow">
            <p>ログインが必要です。ログインするとタスク管理が利用できます。</p>
          </div>
        </div>
      ) : isLoading ? (
        // タスクデータローディング表示
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">タスクデータを読み込み中...</p>
        </div>
      ) : (
        // タスク管理UI表示
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
              className={`bg-white shadow-lg transition-all duration-30 ease-in-out w-full max-w-md sm:max-w-sm md:max-w-md h-full overflow-y-auto no-scrollbar
                      ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="p-4 h-full overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">タスク管理</h1>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-white px-3 py-1 rounded-full flex items-center">
                      <span className="font-bold">{user.points}</span>
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

                {/* 操作中の状態表示 */}
                {(operationStates.toggleTask ||
                  operationStates.addTask ||
                  operationStates.deleteTask ||
                  operationStates.clearCompleted) && (
                  <div className="text-center py-2 text-sm text-primary bg-primary/5 rounded-md shadow-sm my-2 px-3">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-b-transparent"></div>
                      {operationStates.toggleTask && "タスク状態を更新中..."}
                      {operationStates.addTask && "タスクを追加中..."}
                      {operationStates.deleteTask && "タスクを削除中..."}
                      {operationStates.clearCompleted &&
                        "完了タスクを削除中..."}
                    </div>
                  </div>
                )}

                <TaskList
                  tasks={tasks}
                  filter={TaskFilter.ALL}
                  onToggle={toggleTask}
                  onDelete={handleDeleteTask}
                />

                {showPointAnimation && (
                  <PointAnimation
                    show={true}
                    onAnimationEnd={handleAnimationEnd}
                  />
                )}

                {isSaving && (
                  <div className="text-sm text-gray-500 mt-4 text-center">
                    変更を保存中...
                  </div>
                )}

                {/* データリセットボタン - 開発者向け */}
                <div className="mt-8 border-t pt-4 text-center">
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "タスクデータを再読み込みしますか？\n※この操作は編集中の内容を破棄します"
                        )
                      ) {
                        console.log("タスクデータを強制リフレッシュします");
                        try {
                          // 操作中の状態を設定
                          setOperationStates({
                            toggleTask: false,
                            addTask: false,
                            deleteTask: false,
                            clearCompleted: false,
                          });

                          // データ再読み込み前のローディング設定
                          setIsLoading(true);

                          // AuthProviderのforceRefresh関数を呼び出し
                          const success = await forceRefresh();

                          if (success) {
                            console.log(
                              "タスクデータの再読み込みに成功しました"
                            );
                          } else {
                            console.error(
                              "タスクデータの再読み込みに失敗しました"
                            );
                          }
                        } catch (err) {
                          console.error("データリフレッシュエラー:", err);
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                    className="text-xs text-gray-300 hover:text-gray-500 underline-offset-2"
                  >
                    データを再読み込み
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
