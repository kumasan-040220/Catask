// 環境変数に基づいてログレベルを設定（本番環境では抑制）
const isProduction = process.env.NODE_ENV === "production";

type LogLevel = "info" | "warn" | "error";

/**
 * セキュリティに配慮したログ出力関数
 * 本番環境では情報レベルのログを抑制し、重要なログのみを表示します
 *
 * @param message ログメッセージ
 * @param level ログレベル（info、warn、error）
 * @param includeTimestamp タイムスタンプを含めるかどうか
 */
export function secureLog(
  message: string,
  level: LogLevel = "info",
  includeTimestamp: boolean = true
) {
  // 本番環境ではデバッグ情報の出力を抑制
  if (isProduction && level === "info") return;

  const timestamp = includeTimestamp ? `[${new Date().toISOString()}] ` : "";
  const logMessage = `${timestamp}${message}`;

  switch (level) {
    case "error":
      console.error(logMessage);
      break;
    case "warn":
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

/**
 * エラーオブジェクトを安全にログ出力する関数
 * エラーメッセージのみを出力し、スタックトレースなどの詳細情報は本番環境では出力しない
 *
 * @param message エラーの説明
 * @param error エラーオブジェクト
 */
export function logError(message: string, error: unknown) {
  if (isProduction) {
    // 本番環境では最小限の情報のみ出力
    secureLog(`${message}: エラーが発生しました`, "error");
    return;
  }

  // 開発環境ではより詳細な情報を出力
  if (error instanceof Error) {
    secureLog(`${message}: ${error.message}`, "error");
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    secureLog(`${message}: ${String(error)}`, "error");
  }
}
