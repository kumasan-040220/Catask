import nodemailer from "nodemailer";

// メールトランスポート設定
// 本番環境では環境変数から設定を読み込む
// テスト環境ではetherealメールサービス（テスト用）を使用
let transporter: nodemailer.Transporter;
let emailEnabled = true;

// Etherealアカウントの初期化（非同期）
async function initEtherealTransporter() {
  try {
    // テスト用のアカウントを作成
    const testAccount = await nodemailer.createTestAccount();

    // 作成したアカウント情報でトランスポーターを設定
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    emailEnabled = true;
    console.log("テスト用メールアカウントを作成しました:", testAccount.user);

    // テスト接続
    await transporter.verify();
    console.log("SMTPサーバーへの接続が確認できました");

    return true;
  } catch (error) {
    console.error("テスト用メールアカウントの設定に失敗しました:", error);
    emailEnabled = false;
    return false;
  }
}

// Gmail用の設定を確認する
const isGmailConfig = process.env.EMAIL_SERVER?.includes("gmail");

// 環境変数で設定されたメールサーバーを使用するか、
// テスト用のメールサーバーを使用するかの判断
if (
  (process.env.EMAIL_SERVER || process.env.EMAIL_HOST) &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
) {
  // 本番用のメール設定
  try {
    // サーバー設定
    const host = process.env.EMAIL_SERVER || process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;

    console.log(`メールサーバー設定: ${host}:${port} (secure: ${secure})`);

    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Gmail特有の設定
      ...(isGmailConfig && {
        service: "gmail",
        tls: {
          rejectUnauthorized: false,
        },
      }),
    });

    // 接続確認（非同期だが起動時のみなので例外的に待たずに続行）
    transporter
      .verify()
      .then(() => {
        console.log("本番メールサーバーへの接続が確認できました");
        emailEnabled = true;
      })
      .catch((err) => {
        console.error("本番メールサーバーへの接続に失敗しました:", err);
        console.log("詳細:", JSON.stringify(err));
        emailEnabled = false;
      });
  } catch (error) {
    console.error("メールサーバー設定中にエラーが発生しました:", error);
    emailEnabled = false;
  }
} else {
  // テスト用のメール設定（ethereal.email）
  console.warn(
    "メールサーバー設定が見つかりません。テスト用のメールサーバーを使用します。"
  );

  // 暫定的なトランスポーター（実際には使用されないダミー）
  transporter = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });
  emailEnabled = false;

  // 非同期でEtherealアカウントをセットアップ試行
  initEtherealTransporter().then((success) => {
    if (success) {
      emailEnabled = true;
    } else {
      console.warn(
        "メール機能は無効化されています。メール検証なしでアカウントが作成されます"
      );
    }
  });
}

// 認証コードを送信する関数
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  // メール機能が無効の場合は「成功」として処理（メール検証をスキップする）
  if (!emailEnabled) {
    console.warn(
      `メール機能が無効です。${email}への認証コード送信をスキップしました`
    );
    console.log(`検証コード（ログのみ）: ${code}`);
    return true;
  }

  // 送信元メールアドレス設定
  const fromEmail =
    process.env.EMAIL_FROM ||
    `"Catask 公式" <${process.env.EMAIL_USER || "noreply@catask.example.com"}>`;

  console.log(`メール送信試行: 送信先=${email}, 送信元=${fromEmail}`);

  try {
    // メール送信
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "【重要】Catask - アカウント認証コードのお知らせ",
      text: `Cataskをご利用いただきありがとうございます。

以下の認証コードを入力して、アカウント登録を完了してください。

認証コード: ${code}

このコードは1時間有効です。
心当たりがない場合は、このメールを無視していただいて構いません。

※このメールが迷惑メールフォルダに届いている場合は、「迷惑メールではない」と設定いただけますと幸いです。

---------------------
Catask サポートチーム
※このメールは送信専用のため返信できません。
`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a6ee0; margin: 0;">Catask</h1>
            <p style="color: #666; font-size: 14px;">タスク管理アプリ</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">メールアドレス認証のお願い</h2>
            <p>Cataskへの登録ありがとうございます。アカウント作成を完了するには、以下の認証コードを入力してください。</p>
            
            <div style="background-color: #ffffff; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border: 1px dashed #ccc; border-radius: 5px;">
              ${code}
            </div>
            
            <p style="font-size: 13px; color: #666;">※このコードは1時間有効です。</p>
          </div>
          
          <p>このメールに心当たりがない場合は、無視していただいて構いません。</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; font-size: 13px; color: #666;">
            <p>※このメールが迷惑メールフォルダに届いている場合は、「迷惑メールではない」と設定いただけますと幸いです。</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Catask - 効率的にタスクを管理しましょう</p>
            <p>このメールは送信専用のため返信できません。</p>
          </div>
        </div>
      `,
    });

    console.log("メール送信成功:", info.messageId);

    // テスト用メールの場合、プレビューURLを表示
    if (info.messageId && info.messageId.includes("ethereal")) {
      console.log(
        "テスト用メールプレビューURL:",
        nodemailer.getTestMessageUrl(info)
      );
    }

    return true;
  } catch (error) {
    console.error("メール送信に失敗しました:", error);
    console.error("詳細エラー:", JSON.stringify(error));
    return false;
  }
}

// ランダムな6桁の数字の認証コードを生成する関数
export function generateVerificationCode(): string {
  // 100000から999999までのランダムな整数を生成
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// メール機能が有効かどうかを返す関数
export function isEmailEnabled(): boolean {
  return emailEnabled;
}
