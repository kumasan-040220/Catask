"use client";

import { useState } from "react";
import { useItems } from "../providers/ItemProvider";
import { getItemById } from "../utils/items";
import { ItemCategory } from "../utils/types";

export default function ItemInventory() {
  const { ownedItems, useItem } = useItems();
  const [useMessage, setUseMessage] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<
    ItemCategory | "all"
  >("all");

  // メッセージをクリア
  const clearMessages = () => {
    setTimeout(() => {
      setUseMessage("");
    }, 3000);
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

  // 所持しているアイテムのみを表示
  const inventoryItems = ownedItems
    .map((ownedItem) => {
      const item = getItemById(ownedItem.id);
      if (!item) return null;
      return {
        ...item,
        quantity: ownedItem.quantity,
      };
    })
    .filter((item) => item !== null);

  // カテゴリでフィルター
  const filteredItems =
    selectedCategory === "all"
      ? inventoryItems
      : inventoryItems.filter((item) => item?.category === selectedCategory);

  // 所持アイテムがない場合
  if (inventoryItems.length === 0) {
    return (
      <div className="w-full mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">所持アイテム</h2>
        <p className="text-center text-gray-500">アイテムを所持していません</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-4">所持アイテム</h2>

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
      {useMessage && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded mb-4">
          {useMessage}
        </div>
      )}

      {/* アイテム一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          if (!item) return null;
          return (
            <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <p className="text-gray-600">所持数: {item.quantity}</p>
              <p className="text-sm text-gray-500 mt-1">効果: {item.effect}</p>

              <div className="mt-4">
                <button
                  className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-dark transition-colors w-full"
                  onClick={() => handleUse(item.id, item.name)}
                >
                  使用する
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
