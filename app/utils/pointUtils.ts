// ポイントをローカルストレージから取得
export const getPoints = (): number => {
  if (typeof window === "undefined") return 0;

  const storedPoints = localStorage.getItem("points");
  if (!storedPoints) return 0;

  try {
    return parseInt(storedPoints, 10);
  } catch (error) {
    console.error("ポイントの取得に失敗しました", error);
    return 0;
  }
};

// ポイントをローカルストレージに保存
export const savePoints = (points: number): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("points", points.toString());
};

// ポイントを加算
export const addPoints = (amount: number = 1): number => {
  const currentPoints = getPoints();
  const newPoints = currentPoints + amount;
  savePoints(newPoints);
  return newPoints;
};
