"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Item } from "../utils/types";
import { getItemById } from "../utils/items";
import { useAuth } from "./AuthProvider";
import { useCatStatus } from "./CatStatusProvider";
import { CatStatusType } from "../utils/types";

interface OwnedItem {
  id: string;
  quantity: number;
}

interface ItemContextType {
  ownedItems: OwnedItem[];
  purchaseItem: (itemId: string) => boolean;
  useItem: (itemId: string) => boolean;
  getOwnedItem: (itemId: string) => OwnedItem | undefined;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export function useItems() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemProvider");
  }
  return context;
}

interface ItemProviderProps {
  children: ReactNode;
}

export function ItemProvider({ children }: ItemProviderProps) {
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const { user, updatePoints } = useAuth();
  const { catName, setCatStatus, showItemReaction } = useCatStatus();

  // ローカルストレージから所有アイテムを読み込む
  useEffect(() => {
    const savedItems = localStorage.getItem("ownedItems");
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setOwnedItems(parsedItems);
      } catch (error) {
        console.error("所有アイテムの読み込みに失敗しました", error);
      }
    }
  }, []);

  // 所有アイテムをローカルストレージに保存
  const saveOwnedItems = (items: OwnedItem[]) => {
    localStorage.setItem("ownedItems", JSON.stringify(items));
  };

  // アイテムを購入する関数
  const purchaseItem = (itemId: string): boolean => {
    const item = getItemById(itemId);
    if (!item) {
      console.error("アイテムの購入処理に失敗しました");
      return false;
    }

    // ポイントがあるか確認
    if (!user || user.points < item.price) {
      console.error("ポイント不足のため購入できません");
      return false;
    }

    // ポイントを消費 - 現在のポイントから価格を引いた値を渡す
    const newPoints = user.points - item.price;
    console.log("アイテム購入処理を実行しました");
    updatePoints(newPoints);

    // 所有アイテムを更新
    const existingItemIndex = ownedItems.findIndex((oi) => oi.id === itemId);
    let newOwnedItems: OwnedItem[];

    if (existingItemIndex >= 0) {
      // すでに持っている場合は数量を増やす
      newOwnedItems = [...ownedItems];
      newOwnedItems[existingItemIndex] = {
        ...newOwnedItems[existingItemIndex],
        quantity: newOwnedItems[existingItemIndex].quantity + 1,
      };
    } else {
      // 新しいアイテムの場合は追加
      newOwnedItems = [...ownedItems, { id: itemId, quantity: 1 }];
    }

    setOwnedItems(newOwnedItems);
    saveOwnedItems(newOwnedItems);
    return true;
  };

  // アイテムを使用する関数
  const useItem = (itemId: string): boolean => {
    const ownedItem = ownedItems.find((item) => item.id === itemId);
    if (!ownedItem || ownedItem.quantity <= 0) {
      console.error("アイテム使用処理に失敗しました");
      return false;
    }

    const item = getItemById(itemId);
    if (!item) {
      console.error("アイテム情報の取得に失敗しました");
      return false;
    }

    // アイテムの効果を適用
    setCatStatus(CatStatusType.HAPPY); // アイテム使用時は「HAPPY」状態にする

    // 特別な反応を表示
    showItemReaction(item.reaction);

    // アイテム使用回数を減らす
    const newOwnedItems = ownedItems
      .map((oi) => {
        if (oi.id === itemId) {
          return { ...oi, quantity: oi.quantity - 1 };
        }
        return oi;
      })
      .filter((oi) => oi.quantity > 0); // 数量が0になったアイテムは削除

    setOwnedItems(newOwnedItems);
    saveOwnedItems(newOwnedItems);

    return true;
  };

  // 所有アイテムを取得する関数
  const getOwnedItem = (itemId: string): OwnedItem | undefined => {
    return ownedItems.find((item) => item.id === itemId);
  };

  const value = {
    ownedItems,
    purchaseItem,
    useItem,
    getOwnedItem,
  };

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}
