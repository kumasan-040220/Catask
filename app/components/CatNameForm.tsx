"use client";

import { useState } from "react";
import { useCatStatus } from "../providers/CatStatusProvider";

interface CatNameFormProps {
  onComplete?: () => void;
  className?: string;
}

export default function CatNameForm({
  onComplete,
  className = "",
}: CatNameFormProps) {
  const { setCatName } = useCatStatus();
  const [inputName, setInputName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputName || inputName.trim() === "") {
      setError("猫の名前を入力してください");
      return;
    }

    if (inputName.length > 10) {
      setError("名前は10文字以内で入力してください");
      return;
    }

    // 名前を設定
    setCatName(inputName);
    setInputName("");
    setError("");

    // 完了コールバックがあれば呼び出す
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-center">
        猫の名前を決めてください
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="猫の名前を入力"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={10}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          決定する
        </button>
      </form>
    </div>
  );
}
