"use client";

import { useEffect, useState } from "react";

interface PointAnimationProps {
  show: boolean;
  onAnimationEnd: () => void;
}

export default function PointAnimation({
  show,
  onAnimationEnd,
}: PointAnimationProps) {
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (show) {
      setAnimationClass("animate-in");
      const timer = setTimeout(() => {
        setAnimationClass("animate-out");
        setTimeout(() => {
          onAnimationEnd();
        }, 500);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationEnd]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${animationClass}`}
    >
      <div className="bg-primary text-white py-4 px-6 rounded-full text-xl font-bold relative transform scale-150">
        +1 ポイント
      </div>
    </div>
  );
}

/* アニメーション用のスタイル */
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(1.2); }
  }
  
  .animate-in {
    animation: fadeIn 0.5s ease forwards;
  }
  
  .animate-out {
    animation: fadeOut 0.5s ease forwards;
  }
`;
