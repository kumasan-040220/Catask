export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  estimatedTime: number; // 分単位
  dueDate: Date | null; // 締め切り日時（nullの場合は設定なし）
}

export enum TaskFilter {
  ALL = "all",
  ACTIVE = "active",
  COMPLETED = "completed",
}

// 猫のステータスタイプ
export enum CatStatusType {
  NORMAL = "normal", // 通常状態
  HAPPY = "happy", // 嬉しい状態
  HUNGRY = "hungry", // お腹が空いている状態
  SLEEPY = "sleepy", // 眠い状態
  PLAYFUL = "playful", // 遊びたい状態
}

export enum ItemCategory {
  FOOD = "food",
  TOY = "toy",
  FURNITURE = "furniture",
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ItemCategory;
  effect: string;
  reaction: string;
}

export interface User {
  id?: string;
  email: string;
  password: string;
  createdAt: Date;
  points: number;
  tasks: Task[];
  catAvatar?: CatAvatar | null;
  verified?: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  tempUser?: boolean; // 仮登録フラグ
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  needsVerification?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
}
