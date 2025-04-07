"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleRegisterClick = () => {
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Catask</h1>

        {showLogin ? (
          <LoginForm
            onSuccess={onAuthSuccess}
            onRegisterClick={handleRegisterClick}
          />
        ) : (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onLoginClick={handleLoginClick}
          />
        )}
      </div>
    </div>
  );
}
