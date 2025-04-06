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
  const [useMessage, setUseMessage] = useState<string>("");

  // メッセージをクリア
  const clearMessages = () => {
    setTimeout(() => {
      setPurchaseMessage("");
      setUseMessage("");
    }, 3000);
  };

  // アイテムを購入する
  const handlePurchase = (itemId: string, price: number, name: string) => {
    if (!user || user.points < price) {
      setPurchaseMessage(`ポイントが足りません（必要: ${price}ポイント）`);
      clearMessages();
      return;
    }

    const success = purchaseItem(itemId);
    if (success) {
      setPurchaseMessage(`${name}を購入しました！`);
    } else {
      setPurchaseMessage("購入に失敗しました");
    }
    clearMessages();
  };

  // アイテムを使用する
  const handleUse = (itemId: string, name: string) => {
    const success = useItem(itemId);
    if (success) {
      setUseMessage(`${name}を使用しました！`);
    } else {
      setUseMessage("使用に失敗しました");
    }
    clearMessages();
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

      {useMessage && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded mb-4">
          {useMessage}
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
                  onClick={() => handlePurchase(item.id, item.price, item.name)}
                >
                  購入
                </button>

                {ownedQuantity > 0 && (
                  <button
                    className="bg-secondary text-white px-3 py-1 rounded hover:bg-secondary-dark transition-colors"
                    onClick={() => handleUse(item.id, item.name)}
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
