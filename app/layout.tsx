import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "./providers/AuthProvider";
import { CatStatusProvider } from "./providers/CatStatusProvider";
import { ItemProvider } from "./providers/ItemProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catask - シンプルなタスク管理アプリ",
  description: "Cataskでタスクを簡単に管理できます",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <CatStatusProvider>
            <ItemProvider>
              <div className="min-h-screen bg-gray-50">{children}</div>
            </ItemProvider>
          </CatStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
