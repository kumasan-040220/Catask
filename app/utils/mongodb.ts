import { MongoClient, Db, Collection } from "mongodb";
import crypto from "crypto";

if (!process.env.MONGODB_URI) {
  throw new Error("環境変数MONGODB_URIが設定されていません");
}

// データ暗号化のための秘密鍵（本番環境では必ず環境変数から取得する）
const DEFAULT_KEY = "catask-encryption-key-32chars-long!!";
// 以前使用されていた可能性のあるキー
const FALLBACK_KEYS = [
  "default-dev-key-must-be-32-bytes-long!",
  "fallback-encryption-key-32bytes!!!",
  "catask-encryption-key-32chars-long!!",
  "catask-encryption-key-32chars-long",
  "catask-key-for-encryption-32chars!!",
  // 特殊文字の組み合わせバリエーション
  "catask-encryption-key-32chars-long!",
  "catask!encryption!key!32chars!long!!",
  "catask-encryption-key-32chars-long!@",
  "catask!encryption@key#32chars$long%",
  // 空白を含むバリエーション
  "catask encryption key 32chars long!!",
  // 短いキーのパディングバリエーション
  "catask",
  "catask-key",
  "catask-encryption",
];
// 初期化ベクトル長
const IV_LENGTH = 16;

// 安全な復号化を行うための設定
const USE_PLAINTEXT_BACKUP = true; // 暗号化とともに平文のバックアップも保存するかどうか
// 暗号化を無効化
const DISABLE_ENCRYPTION = true; // 暗号化を完全に無効化するフラグ

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let db: Db;

if (process.env.NODE_ENV === "development") {
  // 開発環境ではグローバル変数を使用してホットリロード時の複数接続を防ぐ
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoDb?: Db;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    globalWithMongo._mongoDb = client.db("catask");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
  db = globalWithMongo._mongoDb!;
} else {
  // 本番環境では毎回新しい接続を作成
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  db = client.db("catask");
}

// 暗号化キーを取得する関数
export const getEncryptionKey = (): string => {
  // 環境変数からキーを取得（ない場合はデフォルト値を使用）
  const configKey = process.env.ENCRYPTION_KEY || DEFAULT_KEY;

  try {
    // キーサイズを正確に32バイトにする
    if (configKey.length < 32) {
      // 短すぎる場合はパディング
      console.warn(
        `暗号化キーが短すぎます (${configKey.length}バイト)。32バイトにパディングします。`
      );
      return configKey.padEnd(32, configKey);
    } else if (configKey.length > 32) {
      // 長すぎる場合は切り詰める
      console.warn(
        `暗号化キーが長すぎます (${configKey.length}バイト)。32バイトに切り詰めます。`
      );
      return configKey.substring(0, 32);
    }

    // 正確なサイズの場合はそのまま返す
    return configKey;
  } catch (e) {
    console.error("暗号化キーの準備中にエラーが発生しました:", e);
    // エラーが発生した場合でもフォールバックキーを返す（32バイト固定）
    return DEFAULT_KEY.substring(0, 32);
  }
};

// データ暗号化関数
export function encryptData(text: string): string {
  // 暗号化が無効化されている場合は平文をそのまま返す
  if (DISABLE_ENCRYPTION) {
    console.log(
      `暗号化は無効化されています。平文をそのまま返します: "${text.substring(
        0,
        30
      )}..."`
    );
    return text;
  }

  try {
    if (!text || typeof text !== "string") {
      console.warn("暗号化対象のテキストが無効です");
      return text || "";
    }

    // タイトルが既に暗号化されているかチェック
    if (
      text.includes(":") &&
      text.split(":")[0].length >= 16 &&
      /^[0-9a-f]+$/.test(text.split(":")[0])
    ) {
      console.log(
        `テキストは既に暗号化されているようです: "${text.substring(0, 20)}..."`
      );
      return text;
    }

    // 暗号化前の値をログに出力
    console.log(`暗号化する値: "${text}"`);

    const iv = crypto.randomBytes(IV_LENGTH);
    // 正規化したキーを使用
    const keyBuffer = getNormalizedKey(getEncryptionKey());

    console.log(
      `データを暗号化します: キー長=${keyBuffer.length}, IV長=${
        iv.length
      }, テキスト="${text.substring(0, 30)}..."`
    );

    const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const result = iv.toString("hex") + ":" + encrypted;
    console.log(`暗号化結果: "${result.substring(0, 30)}..."`);

    return result;
  } catch (e) {
    console.error("データ暗号化中にエラーが発生しました:", e);
    // エラーが発生した場合は元のテキストを返す
    return text;
  }
}

// データ復号化関数
export function decryptData(text: string): string {
  try {
    if (!text || typeof text !== "string" || !text.includes(":")) {
      console.warn("復号化対象のテキストが無効です:", text);
      return text || "";
    }

    const textParts = text.split(":");
    if (textParts.length < 2) {
      console.warn("復号化対象のテキストが正しい形式ではありません:", text);
      return text;
    }

    // IV部分を取得（16バイトで固定）
    let ivHex = textParts.shift() || "";
    // IVが32バイト（16バイトの16進数表現）であることを確認
    if (ivHex.length !== 32) {
      console.warn(`不正なIV長: ${ivHex.length}文字（期待値: 32文字）`);
      if (ivHex.length > 32) {
        ivHex = ivHex.substring(0, 32); // 長すぎる場合は切り詰め
      } else if (ivHex.length < 32) {
        ivHex = ivHex.padEnd(32, "0"); // 短すぎる場合はパディング
      }
    }

    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = textParts.join(":");
    const keyBuffer = getNormalizedKey(getEncryptionKey());

    console.log(
      `標準復号化: キー長=${keyBuffer.length}, IV長=${
        iv.length
      }, 暗号文="${text.substring(0, 30)}..."`
    );

    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    console.log(`復号化結果: "${decrypted.substring(0, 30)}..."`);
    return decrypted;
  } catch (e) {
    console.error("データ復号化中にエラーが発生しました:", e);
    return `[復号化エラー] ${text.substring(0, 15)}...`;
  }
}

// オブジェクト内の特定フィールドを暗号化/復号化する関数
export function encryptTaskData(data: any): any {
  if (!data) return data;

  // 暗号化が無効化されている場合は何もせず元のデータを返す
  if (DISABLE_ENCRYPTION) {
    console.log("タスク暗号化は無効化されています。データをそのまま返します。");
    return data;
  }

  try {
    // 配列の場合は各要素を処理
    if (Array.isArray(data)) {
      return data.map((item) => {
        try {
          return encryptTaskData(item);
        } catch (e) {
          console.error("タスク暗号化中に配列要素でエラー:", e);
          return item; // エラーが発生した項目は元のまま返す
        }
      });
    }

    // オブジェクトの場合はフィールドごとに処理
    if (typeof data === "object") {
      const result = { ...data };

      // タスクデータの場合、タイトルを暗号化
      if (result.title && typeof result.title === "string") {
        try {
          // すでに暗号化されていないか確認
          if (
            !result.title.includes(":") ||
            result.title.startsWith("[暗号化失敗]")
          ) {
            // 平文バックアップを保存する場合は、plainTitleフィールドに元のタイトルを保持
            if (USE_PLAINTEXT_BACKUP) {
              result.plainTitle = result.title;
              console.log(
                `タイトルの平文バックアップを保存: "${result.title}"`
              );
            }
            result.title = encryptData(result.title);
          } else {
            console.log(
              "タイトルはすでに暗号化形式のようです:",
              result.title.substring(0, 20)
            );
          }
        } catch (e) {
          console.error("タイトル暗号化中にエラー:", e);
          // エラーが発生した場合は元のタイトルを保持
        }
      }

      // Taskオブジェクト内にあるかもしれない他のデータも処理
      if (result.tasks && Array.isArray(result.tasks)) {
        try {
          result.tasks = result.tasks.map((task) => encryptTaskData(task));
        } catch (e) {
          console.error("タスク配列の暗号化中にエラー:", e);
          // エラーが発生した場合は元のタスク配列を保持
        }
      }

      return result;
    }

    return data;
  } catch (e) {
    console.error("タスクデータ暗号化中に致命的なエラー:", e);
    return data; // エラーが発生した場合は元のデータを返す
  }
}

// オブジェクト内の特定フィールドを復号化する関数
export function decryptTaskData(data: any): any {
  if (!data) return data;

  // 配列の場合は各要素を処理
  if (Array.isArray(data)) {
    return data.map((item) => {
      try {
        return decryptTaskData(item);
      } catch (e) {
        console.error("配列内のタスク復号化中にエラー:", e);
        return item; // エラー時は元の項目を返す
      }
    });
  }

  // オブジェクトの場合はフィールドごとに処理
  if (typeof data === "object") {
    const result = { ...data };

    // 平文バックアップがある場合はそれを優先的に使用
    if (result.plainTitle && typeof result.plainTitle === "string") {
      console.log(
        `平文バックアップを使用します: "${result.plainTitle.substring(
          0,
          30
        )}..."`
      );
      result.title = result.plainTitle;
    }
    // 暗号化されたタイトルの場合は復号化を試みる
    else if (
      result.title &&
      typeof result.title === "string" &&
      result.title.includes(":") &&
      /^[0-9a-f]+$/.test(result.title.split(":")[0])
    ) {
      try {
        console.log(
          `暗号化タイトルを検出: "${result.title.substring(0, 20)}..."`
        );
        // すべてのキーを試して復号化
        const decrypted = tryDecryptWithFallbackKeys(result.title);
        if (decrypted && !decrypted.startsWith("[復号化")) {
          console.log(`復号化成功: "${decrypted.substring(0, 30)}..."`);
          result.title = decrypted;
          // 平文バックアップも保存
          result.plainTitle = decrypted;
        } else {
          // 復号化に失敗した場合は既定のタイトルを設定
          console.warn(
            `復号化に失敗しました: "${result.title.substring(0, 20)}..."`
          );
          result.title = `タスク ${result.id || "不明"}`;
          result.plainTitle = result.title;
        }
      } catch (e) {
        console.error("タイトル復号化中にエラー:", e);
        result.title = `タスク ${result.id || "不明"}`;
        result.plainTitle = result.title;
      }
    }
    // 復号化できないタイトルを持つ場合はデフォルトタイトルを設定
    else if (
      result.title &&
      typeof result.title === "string" &&
      (result.title.startsWith("[復号化不可]") ||
        result.title.startsWith("[復号化エラー]"))
    ) {
      result.title = `タスク ${result.id || "不明"}`;
      result.plainTitle = result.title;
    }

    // Taskオブジェクト内にあるかもしれない他のデータも処理
    if (result.tasks && Array.isArray(result.tasks)) {
      try {
        result.tasks = result.tasks.map((task) => decryptTaskData(task));
      } catch (e) {
        console.error("タスク配列の復号化中にエラー:", e);
      }
    }

    return result;
  }

  return data;
}

// 現在の設定でキーを取得して復号化を試みる
function tryDecryptWithCurrentKey(text: string): string {
  try {
    if (!text) return "";
    const key = getEncryptionKey();
    console.log(`現在のキーで復号化試行: キー長=${key.length}`);
    return decryptData(text);
  } catch (e) {
    console.error("現在のキーでの復号化中にエラー:", e);
    return "";
  }
}

// すべてのフォールバックキーを試してみる
function tryDecryptWithFallbackKeys(text: string): string {
  if (!text) return "";

  for (let i = 0; i < FALLBACK_KEYS.length; i++) {
    try {
      const key = FALLBACK_KEYS[i].substring(0, 32);
      console.log(
        `フォールバックキー${i + 1}で復号化試行: キー長=${key.length}`
      );

      const result = decryptWithSpecificKey(text, key);
      if (result && !result.startsWith("[復号化")) {
        return result;
      }
    } catch (e) {
      console.log(`フォールバックキー${i + 1}での復号化に失敗:`, e.message);
    }
  }

  return "";
}

// 32バイトに標準化したキーを取得する
function getNormalizedKey(key: string): Buffer {
  // キーがnullまたは空の場合はデフォルト値を使用
  if (!key) {
    key = DEFAULT_KEY;
  }

  // キーの長さを正確に32バイトに調整
  if (key.length < 32) {
    // 短すぎる場合はパディング
    return Buffer.from(key.padEnd(32, key));
  } else if (key.length > 32) {
    // 長すぎる場合は切り詰める
    return Buffer.from(key.substring(0, 32));
  }

  // 正確なサイズ
  return Buffer.from(key);
}

// 特定のキーを使用して復号化する
function decryptWithSpecificKey(text: string, key: string): string {
  try {
    if (!text || typeof text !== "string" || !text.includes(":")) {
      return "";
    }

    const textParts = text.split(":");
    if (textParts.length < 2) {
      return "";
    }

    // IV部分を取得（16バイトで固定）
    let ivHex = textParts.shift() || "";
    // IVが32バイト（16バイトの16進数表現）であることを確認
    if (ivHex.length !== 32) {
      console.warn(`不正なIV長: ${ivHex.length}文字（期待値: 32文字）`);
      if (ivHex.length > 32) {
        ivHex = ivHex.substring(0, 32); // 長すぎる場合は切り詰め
      } else if (ivHex.length < 32) {
        ivHex = ivHex.padEnd(32, "0"); // 短すぎる場合はパディング
      }
    }

    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = textParts.join(":");

    // キーを正規化
    const keyBuffer = getNormalizedKey(key);

    console.log(
      `特定キーでの復号化: キー長=${keyBuffer.length}, IV長=${iv.length}, テキスト長=${encryptedText.length}`
    );

    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (e) {
    console.log(`特定キーでの復号化に失敗: ${e.message}`);
    return "";
  }
}

// タスクデータベースをクリーンアップ（平文復元）
export function migrateEncryptedTasks(tasks: any[]): any[] {
  if (!tasks || !Array.isArray(tasks)) return tasks || [];

  console.log(`${tasks.length}件のタスクをマイグレーションします`);

  return tasks.map((task) => {
    try {
      const newTask = { ...task };

      // 平文バックアップがある場合
      if (newTask.plainTitle && typeof newTask.plainTitle === "string") {
        console.log(
          `タスク ${newTask.id} のタイトルを平文バックアップから復元: "${newTask.plainTitle}"`
        );
        newTask.title = newTask.plainTitle;
        // plainTitleを維持（あえて削除しない）
      }
      // 復号化できないタイトルを持つ場合
      else if (
        newTask.title &&
        typeof newTask.title === "string" &&
        (newTask.title.startsWith("[復号化不可]") ||
          newTask.title.startsWith("[復号化エラー]"))
      ) {
        // "復号化不可"の表示を消してみる
        const cleanTitle = newTask.title
          .replace(/^\[復号化不可\]\s*/, "")
          .replace(/^\[復号化エラー\]\s*/, "");

        // 元の暗号化タイトルが残っている場合は一度復号化を試みる
        if (
          cleanTitle.includes(":") &&
          /^[0-9a-f]+/.test(cleanTitle.split(":")[0])
        ) {
          console.log(
            `強制再復号化を試みます: "${cleanTitle.substring(0, 20)}..."`
          );
          const forcedDecrypt = tryAllPossibleKeys(cleanTitle);
          if (forcedDecrypt && !forcedDecrypt.startsWith("[復号化")) {
            newTask.title = forcedDecrypt;
            newTask.plainTitle = forcedDecrypt;
          } else {
            // 依然として復号化できない場合はデフォルトのタイトルをセット
            newTask.title = `タスク ${newTask.id || "ID不明"}`;
            newTask.plainTitle = newTask.title;
          }
        } else {
          // デフォルトタイトルをセット
          newTask.title = `タスク ${newTask.id || "ID不明"}`;
          newTask.plainTitle = newTask.title;
        }
      }

      return newTask;
    } catch (e) {
      console.error("タスクのマイグレーション中にエラー:", e);
      return task;
    }
  });
}

// すべての可能なキーを試す最終手段
function tryAllPossibleKeys(text: string): string {
  // 標準のフォールバックキーを試す
  const normalDecrypt = tryDecryptWithFallbackKeys(text);
  if (normalDecrypt && !normalDecrypt.startsWith("[復号化")) {
    return normalDecrypt;
  }

  // 既存のキーに様々なパターンを適用してみる
  const keyPatterns = [
    // 基本キー
    "catask",
    // 異なる長さのキー
    "catask-key",
    "catask-key-for-encryption",
    // 特殊文字パターン
    "catask!key",
    "catask@key",
    "catask#key",
    "catask$key",
    "catask%key",
    "catask^key",
    "catask&key",
    "catask*key",
    // 異なる文字列
    "encryption-key",
    "task-manager",
    "task-encryption",
    "secure-task-key",
    // 完全にランダムな文字列（最後の手段）
    "abcdefghijklmnopqrstuvwxyz123456",
    "0123456789abcdef0123456789abcdef",
  ];

  for (const pattern of keyPatterns) {
    try {
      const normalizedKey = getNormalizedKey(pattern);
      console.log(`特殊パターンキーで試行: "${pattern.substring(0, 10)}..."`);

      const result = decryptWithSpecificKey(text, pattern);
      if (
        result &&
        result.length > 0 &&
        !/^[\x00-\x1F\x7F-\xFF]+$/.test(result)
      ) {
        console.log(
          `特殊パターンキーで復号化に成功: "${result.substring(0, 20)}..."`
        );
        return result;
      }
    } catch (e) {
      // エラーはスキップ
    }
  }

  // テキストとして意味のある文字列になるかどうかをバイトレベルで調査
  try {
    const parts = text.split(":");
    if (parts.length >= 2) {
      const encrypted = parts[1];
      // 16進数を直接文字列に変換してみる（最後の手段）
      const directConvert = Buffer.from(encrypted, "hex").toString("utf8");
      if (
        directConvert &&
        directConvert.length > 0 &&
        /^[\u0020-\u007E\u3000-\u30FF\u4E00-\u9FAF]+$/.test(directConvert)
      ) {
        console.log(
          `直接変換で読める文字列を検出: "${directConvert.substring(0, 20)}..."`
        );
        return directConvert;
      }
    }
  } catch (e) {
    // エラーはスキップ
  }

  return `[復号化不可] ${text.substring(0, 10)}...`;
}

// MongoDBデータベースへのエクスポート
export { clientPromise, db };

// 拡張されたコレクション取得関数
export const getCollection = (name: string): Collection => {
  const collection = db.collection(name);
  return collection;
};
