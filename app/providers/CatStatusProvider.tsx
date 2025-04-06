"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CatStatusType } from "../utils/types";

// デフォルトの猫の名前
const DEFAULT_CAT_NAME = "ミケ";

// 猫の様子メッセージ（ものに反応していないもの）
const CAT_BEHAVIOR_MESSAGES = [
  "はのんびりと日向ぼっこをしている",
  "はクッションの上でまるくなっている",
  "は尻尾をゆらゆら振っている",
  "は耳をぴくぴく動かしている",
  "はひげを前に出して何かを探っている",
  "は前足で顔を洗っている",
  "は気持ちよさそうに伸びをしている",
  "はゴロゴロと喉を鳴らしている",
  "は両耳を後ろに倒している",
  "は狩りの姿勢で低く身を潜めている",
  "は静かに爪とぎをしている",
  "は退屈そうにあくびをしている",
  "は気持ちよさそうにうとうとしている",
  "は急に走り出した",
  "はお気に入りの場所でくつろいでいる",
  "は布団の中で丸まっている",
  "は毛づくろいに夢中だ",
  "は高い場所から世界を見下ろしている",
  "はソファの下に隠れている",
  "は背伸びをしながらあくびをしている",
  "は急に何かを思い出したように走り出した",
  "は寝返りをうった",
  "は縄張りを確認するように部屋を歩き回っている",
  "は後ろ足で耳の後ろを掻いている",
  "は飼い主の足元でくるくる回っている",
  "はふわふわの毛布の上でリラックスしている",
  "は冷たい床の上で涼んでいる",
  "は思い切り伸びをしている",
  "は寝ながら夢を見て足をピクピク動かしている",
  "は甘えたそうに鳴いている",
  "は気持ち良さそうに目を細めている",
  "は眠たそうに目をこすっている",
  "は落ち着きなく部屋を歩き回っている",
  "は口の周りをなめて満足そうにしている",
  "は遊びたそうに尻尾を振っている",
  "は何かを考えているようにじっとしている",
  "は早朝から元気に駆け回っている",
  "は部屋の隅でひっそりとくつろいでいる",
  "は肉球を見せてポーズをとっている",
  "はハミングバードのように尻尾が高速で動いている",
  "は何かを思い出したように突然立ち上がった",
  "は意味もなく急に走り回っている",
  "は飼い主が帰ってきて嬉しそうにしている",
  "は食後の満足感からうとうとしている",
  "は静かにゴロゴロと喉を鳴らしている",
  "は前足をピンと伸ばして爪とぎをした",
  "は日差しの中で毛づくろいをしている",
  "は前足を揃えて威厳のある姿勢でくつろいでいる",
];

// ローカルストレージのキー
const STORAGE_KEYS = {
  CAT_NAME: "catName",
  STATUS_LOGS: "catStatusLogs",
  CURRENT_MESSAGE: "catCurrentMessage",
  LAST_UPDATE_TIME: "catLastUpdateTime",
  USED_INDEXES: "catUsedIndexes",
};

// ログメッセージの型
interface CatStatusLog {
  message: string;
  timestamp: Date;
}

interface CatStatusContextType {
  catName: string;
  setCatName: (name: string) => void;
  statusType: CatStatusType;
  statusMessage: string;
  setCatStatus: (newStatus: CatStatusType) => void;
  refreshMessage: () => void;
  isNameSet: boolean;
  statusLogs: CatStatusLog[];
  showItemReaction: (reaction: string) => void;
}

const CatStatusContext = createContext<CatStatusContextType | undefined>(
  undefined
);

export function useCatStatus() {
  const context = useContext(CatStatusContext);
  if (!context) {
    throw new Error("useCatStatus must be used within a CatStatusProvider");
  }
  return context;
}

interface CatStatusProviderProps {
  children: ReactNode;
}

export function CatStatusProvider({ children }: CatStatusProviderProps) {
  const [catName, setCatName] = useState<string>(DEFAULT_CAT_NAME);
  const [isNameSet, setIsNameSet] = useState<boolean>(false);
  const [statusType, setStatusType] = useState<CatStatusType>(
    CatStatusType.NORMAL
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusLogs, setStatusLogs] = useState<CatStatusLog[]>([]);
  const [usedMessageIndexes, setUsedMessageIndexes] = useState<number[]>([]);
  const [lastUpdateMinute, setLastUpdateMinute] = useState<number>(-1);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 現在のメッセージとタイムスタンプをローカルストレージに保存
  const saveCurrentState = (message: string, indexes: number[]) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MESSAGE, message);
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, new Date().toString());
    localStorage.setItem(STORAGE_KEYS.USED_INDEXES, JSON.stringify(indexes));
  };

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    // すでに初期化済みの場合は何もしない（リロード時に二重初期化を防止）
    if (isInitialized) return;

    const savedName = localStorage.getItem(STORAGE_KEYS.CAT_NAME);
    if (savedName) {
      setCatName(savedName);
      setIsNameSet(true);
    }

    // 現在のメッセージを復元
    const savedMessage = localStorage.getItem(STORAGE_KEYS.CURRENT_MESSAGE);
    const savedUpdateTime = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
    const savedIndexes = localStorage.getItem(STORAGE_KEYS.USED_INDEXES);

    // 保存されたメッセージがある場合
    if (savedMessage && savedUpdateTime) {
      setStatusMessage(savedMessage);

      // 最後の更新時間を復元
      const lastUpdateTime = new Date(savedUpdateTime);
      setLastUpdateMinute(lastUpdateTime.getMinutes());

      // 使用済みインデックスを復元
      if (savedIndexes) {
        try {
          const parsedIndexes = JSON.parse(savedIndexes);
          setUsedMessageIndexes(parsedIndexes);
        } catch (error) {
          console.error("使用済みインデックスの復元に失敗しました", error);
        }
      }
    } else {
      // 保存されたメッセージがない場合、初期メッセージを生成
      const initialIndex = Math.floor(
        Math.random() * CAT_BEHAVIOR_MESSAGES.length
      );
      const initialMessage = CAT_BEHAVIOR_MESSAGES[initialIndex];
      setStatusMessage(initialMessage);
      setUsedMessageIndexes([initialIndex]);
      saveCurrentState(initialMessage, [initialIndex]);
    }

    // ログを復元
    const savedLogs = localStorage.getItem(STORAGE_KEYS.STATUS_LOGS);
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        // タイムスタンプをDateオブジェクトに戻す
        const formattedLogs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        setStatusLogs(formattedLogs);
      } catch (error) {
        console.error("猫ステータスログの復元に失敗しました", error);
      }
    }

    // 初期化完了
    setIsInitialized(true);
  }, [isInitialized]);

  // 猫の名前を設定する関数
  const handleSetCatName = (name: string) => {
    if (name && name.trim() !== "") {
      const trimmedName = name.trim();
      setCatName(trimmedName);
      setIsNameSet(true);
      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEYS.CAT_NAME, trimmedName);
    }
  };

  // 重複しない新しいメッセージを生成
  const generateNewMessage = () => {
    let availableIndexes = Array.from(
      { length: CAT_BEHAVIOR_MESSAGES.length },
      (_, i) => i
    ).filter((index) => !usedMessageIndexes.includes(index));

    // すべてのメッセージを使い切った場合、リセット
    if (availableIndexes.length === 0) {
      setUsedMessageIndexes([]);
      availableIndexes = Array.from(
        { length: CAT_BEHAVIOR_MESSAGES.length },
        (_, i) => i
      );
    }

    // ランダムなインデックスを選択
    const randomIndex = Math.floor(Math.random() * availableIndexes.length);
    const selectedIndex = availableIndexes[randomIndex];
    const newMessage = CAT_BEHAVIOR_MESSAGES[selectedIndex];

    // 使用済みインデックスを更新
    const updatedIndexes = [...usedMessageIndexes, selectedIndex];
    setUsedMessageIndexes(updatedIndexes);

    // メッセージを設定
    setStatusMessage(newMessage);

    // 現在の状態を保存
    saveCurrentState(newMessage, updatedIndexes);

    // ログに追加
    addToLog(newMessage);
  };

  // ログに追加する関数
  const addToLog = (message: string) => {
    const newLog = {
      message: `${catName}${message}`,
      timestamp: new Date(),
    };

    const updatedLogs = [...statusLogs, newLog];
    // 最大30件までログを保持
    if (updatedLogs.length > 30) {
      updatedLogs.shift(); // 古いログを削除
    }

    setStatusLogs(updatedLogs);

    // ローカルストレージに保存
    localStorage.setItem(STORAGE_KEYS.STATUS_LOGS, JSON.stringify(updatedLogs));
  };

  // 外部から強制的にメッセージを更新する関数（今後の拡張用に残す）
  const refreshMessage = () => {
    // 時計の分が変わるタイミングでのみ更新するため、
    // 直接更新しないようにします
    // 代わりに現在の分と最後の更新分を比較
    const now = new Date();
    const currentMinute = now.getMinutes();
    if (currentMinute !== lastUpdateMinute) {
      generateNewMessage();
      setLastUpdateMinute(currentMinute);
    }
  };

  // 外部からステータスを変更する関数
  const setCatStatus = (newStatus: CatStatusType) => {
    setStatusType(newStatus);
    // ステータスタイプを変更しても、メッセージは時計の分が変わるまで更新しない
  };

  // アイテム使用時の特別な反応を表示する関数
  const showItemReaction = (reaction: string) => {
    // 特別なメッセージを設定
    setStatusMessage(reaction);

    // ログに追加
    addToLog(reaction);

    // 現在の使用済みインデックスを保持
    saveCurrentState(reaction, usedMessageIndexes);

    // 状態をHAPPYに設定
    setStatusType(CatStatusType.HAPPY);
  };

  // タイマー設定 - 別のuseEffectで分離して依存関係をクリアにする
  useEffect(() => {
    // 初期化が完了していない場合は何もしない
    if (!isInitialized) return;

    // 次の「分」が始まるまでの時間を計算する関数
    const getTimeUntilNextMinute = () => {
      const now = new Date();
      const secondsLeft = 60 - now.getSeconds();
      const millisecondsLeft = secondsLeft * 1000 - now.getMilliseconds();
      return millisecondsLeft > 0 ? millisecondsLeft : 0;
    };

    console.log(
      "タイマーを設定します: 次の分まで",
      getTimeUntilNextMinute(),
      "ミリ秒"
    );

    // 最初のタイマーは次の分の開始時に設定
    const initialTimer = setTimeout(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      console.log(
        "最初のタイマーが発火しました。現在の分:",
        currentMinute,
        "最後の更新分:",
        lastUpdateMinute
      );

      // 現在の分が最後の更新時の分と異なる場合のみ更新
      if (currentMinute !== lastUpdateMinute) {
        console.log("メッセージを更新します");
        generateNewMessage();
        setLastUpdateMinute(currentMinute);
      }

      // その後は毎分0秒に更新するインターバルを設定
      console.log("1分間隔のタイマーを設定します");
      const minuteInterval = setInterval(() => {
        const now = new Date();
        console.log(
          "インターバルが発火しました。現在時刻:",
          now.toTimeString()
        );
        generateNewMessage();
        setLastUpdateMinute(now.getMinutes());
      }, 60000); // 1分 = 60000ミリ秒

      // このコンポーネントがアンマウントされた時にインターバルをクリア
      return () => {
        console.log("インターバルをクリアします");
        clearInterval(minuteInterval);
      };
    }, getTimeUntilNextMinute());

    // クリーンアップ関数で最初のタイマーをクリア
    return () => {
      console.log("初期タイマーをクリアします");
      clearTimeout(initialTimer);
    };
  }, [isInitialized, lastUpdateMinute]);

  const value = {
    catName,
    setCatName: handleSetCatName,
    statusType,
    statusMessage,
    setCatStatus,
    refreshMessage,
    isNameSet,
    statusLogs,
    showItemReaction,
  };

  return (
    <CatStatusContext.Provider value={value}>
      {children}
    </CatStatusContext.Provider>
  );
}
