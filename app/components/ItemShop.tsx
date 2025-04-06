"use client";

import { useState } from "react";
import { useItems } from "../providers/ItemProvider";
import { ITEMS, getItemsByCategory } from "../utils/items";
import { ItemCategory } from "../utils/types";
import { useAuth } from "../providers/AuthProvider";

export default function ItemShop() {
  const { ownedItems, purchaseItem, useItem } = useItems();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<
    ItemCategory | "all"
  >("all");
  const [purchaseMessage, setPurchaseMessage] = useState<string>("");
  const [confirmItem, setConfirmItem] = useState<{
    id: string;
    price: number;
    name: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // メッセージをクリア
  const clearMessages = () => {
    setTimeout(() => {
      setPurchaseMessage("");
    }, 3000);
  };

  // 購入確認ダイアログを表示
  const showPurchaseConfirm = (itemId: string, price: number, name: string) => {
    if (isProcessing) return;
    setConfirmItem({ id: itemId, price, name });
  };

  // 購入確認をキャンセル
  const cancelPurchase = () => {
    setConfirmItem(null);
  };

  // アイテムを購入する
  const handlePurchase = () => {
    if (!confirmItem || isProcessing) return;

    const { id, price, name } = confirmItem;

    if (!user || user.points < price) {
      setPurchaseMessage(`ポイントが足りません（必要: ${price}ポイント）`);
      setConfirmItem(null);
      clearMessages();
      return;
    }

    setIsProcessing(true);

    try {
      const success = purchaseItem(id);
      if (!success) {
        setPurchaseMessage("購入に失敗しました");
      }
    } catch (error) {
      setPurchaseMessage("購入処理中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
      setConfirmItem(null);
      clearMessages();
    }
  };

  // アイテムを使用する
  const handleUse = (itemId: string, name: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const success = useItem(itemId);
      if (!success) {
        setPurchaseMessage("使用に失敗しました");
      }
    } catch (error) {
      setPurchaseMessage("使用処理中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
      clearMessages();
    }
  };

  // 表示するアイテムをフィルタリング
  const filteredItems =
    selectedCategory === "all" ? ITEMS : getItemsByCategory(selectedCategory);

  // 所有数を取得
  const getOwnedQuantity = (itemId: string) => {
    const ownedItem = ownedItems.find((item) => item.id === itemId);
    return ownedItem ? ownedItem.quantity : 0;
  };

  return (
    <div className="w-full mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-4">アイテムショップ</h2>

      {/* カテゴリ選択タブ */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border ${
              selectedCategory === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } rounded-l-lg`}
            onClick={() => setSelectedCategory("all")}
          >
            すべて
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              selectedCategory === ItemCategory.FOOD
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setSelectedCategory(ItemCategory.FOOD)}
          >
            食料
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              selectedCategory === ItemCategory.TOY
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setSelectedCategory(ItemCategory.TOY)}
          >
            おもちゃ
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              selectedCategory === ItemCategory.FURNITURE
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } rounded-r-lg`}
            onClick={() => setSelectedCategory(ItemCategory.FURNITURE)}
          >
            家具
          </button>
        </div>
      </div>

      {/* メッセージ表示 */}
      {purchaseMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
          {purchaseMessage}
        </div>
      )}

      {/* 購入確認ダイアログ */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">購入の確認</h3>
            <p className="mb-4">
              {confirmItem.name}を{confirmItem.price}ポイントで購入しますか？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                onClick={cancelPurchase}
                disabled={isProcessing}
              >
                キャンセル
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors flex items-center"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    処理中...
                  </>
                ) : (
                  "購入する"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* アイテム一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const ownedQuantity = getOwnedQuantity(item.id);
          return (
            <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <p className="text-primary font-medium">
                価格: {item.price}ポイント
              </p>
              <p className="text-gray-600">所持数: {ownedQuantity}</p>

              <div className="mt-4 flex space-x-2">
                <button
                  className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark transition-colors"
                  onClick={() =>
                    showPurchaseConfirm(item.id, item.price, item.name)
                  }
                  disabled={isProcessing}
                >
                  購入
                </button>

                {ownedQuantity > 0 && (
                  <button
                    className="bg-secondary text-white px-3 py-1 rounded hover:bg-secondary-dark transition-colors"
                    onClick={() => handleUse(item.id, item.name)}
                    disabled={isProcessing}
                  >
                    使用
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
