import { Item, ItemCategory } from "./types";

export const ITEMS: Item[] = [
  // 食料アイテム
  {
    id: "water",
    name: "水",
    description: "新鮮な水です。猫は水分補給が大切です。",
    price: 2,
    category: ItemCategory.FOOD,
    effect: "水分補給ができました",
    reaction: "は水をちょびちょび飲んでいる",
  },
  {
    id: "milk",
    name: "ミルク",
    description: "猫用のミルクです。おやつにぴったり。",
    price: 4,
    category: ItemCategory.FOOD,
    effect: "おやつを楽しみました",
    reaction: "はミルクを美味しそうに舐めている",
  },
  {
    id: "tuna",
    name: "ツナ缶",
    description: "猫が大好きなツナの缶詰です。",
    price: 6,
    category: ItemCategory.FOOD,
    effect: "特別な食事を楽しみました",
    reaction: "はツナ缶に夢中で、幸せそうな顔をしている",
  },
  {
    id: "churru",
    name: "チュール",
    description: "猫が喜ぶおやつの定番、チュールです。",
    price: 8,
    category: ItemCategory.FOOD,
    effect: "最高のおやつを堪能しました",
    reaction: "はチュールに大興奮！手からなめ取っている",
  },

  // おもちゃ
  {
    id: "feather",
    name: "ねこじゃらし",
    description: "猫が夢中になるねこじゃらしです。",
    price: 5,
    category: ItemCategory.TOY,
    effect: "遊びを楽しみました",
    reaction: "はねこじゃらしに飛びついて遊んでいる",
  },
  {
    id: "laser",
    name: "レーザーポインター",
    description: "赤い光を追いかけて猫が大興奮します。",
    price: 10,
    category: ItemCategory.TOY,
    effect: "活発に遊びました",
    reaction: "はレーザーポインターの光を必死に追いかけている",
  },
  {
    id: "mouse",
    name: "ねずみのおもちゃ",
    description: "リアルな動きをするねずみのおもちゃです。",
    price: 15,
    category: ItemCategory.TOY,
    effect: "狩りの本能が刺激されました",
    reaction: "はねずみのおもちゃを狩る姿勢で狙っている",
  },
  {
    id: "plush",
    name: "お気に入りのぬいぐるみ",
    description: "猫専用の特別なぬいぐるみです。",
    price: 20,
    category: ItemCategory.TOY,
    effect: "特別なおもちゃに大満足",
    reaction: "はお気に入りのぬいぐるみを抱きしめて喉を鳴らしている",
  },

  // 家具
  {
    id: "scratcher",
    name: "爪研ぎ",
    description: "猫が爪を研げる専用の柱です。",
    price: 3,
    category: ItemCategory.FURNITURE,
    effect: "爪を気持ちよく研げました",
    reaction: "は爪研ぎで気持ちよさそうに爪を研いでいる",
  },
  {
    id: "tower",
    name: "キャットタワー",
    description: "猫が登ったり休んだりできる大型タワーです。",
    price: 6,
    category: ItemCategory.FURNITURE,
    effect: "高い場所から部屋を見渡せました",
    reaction: "はキャットタワーの一番高い場所で寛いでいる",
  },
  {
    id: "lap",
    name: "膝上",
    description: "あなたの膝の上で猫をなでてあげましょう。",
    price: 9,
    category: ItemCategory.FURNITURE,
    effect: "飼い主との触れ合いを楽しみました",
    reaction: "は膝の上で気持ちよさそうに丸まっている",
  },
];

export function getItemById(id: string): Item | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function getItemsByCategory(category: ItemCategory): Item[] {
  return ITEMS.filter((item) => item.category === category);
}
