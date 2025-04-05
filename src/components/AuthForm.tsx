"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { validateForm } from "@/utils/validateForm";
import { useRouter } from "next/navigation";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleGoogleLogin = (response: CredentialResponse) => {
    console.log(response);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    const validationErrors = validateForm(email, password);
    setErrors(validationErrors);

    if (validationErrors.email || validationErrors.password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/home");
      } else {
        setErrorMessage(data.message || "Login failed.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (hasSubmitted) {
      const newErrors = validateForm(e.target.value, password);
      setErrors((prev) => ({ ...prev, email: newErrors.email }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (hasSubmitted) {
      const newErrors = validateForm(email, e.target.value);
      setErrors((prev) => ({ ...prev, password: newErrors.password }));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="relative w-full max-w-md p-6 backdrop-blur-xl rounded-xl shadow-sm border border-[#37332f]">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/logo/logo.png" alt="LitHub Logo" width={150} height={150} />
        </div>

        {/* Auth form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-medium text-[#37332f]">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="mt-1 block w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-all border-[#37332f] focus:ring-[#908a80] bg-white/20 text-[#37332f]"
              placeholder="Enter your email"
            />
            {(errors.email || errorMessage) && (
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 group ${shake ? "animate-shake" : ""}`}>
                <span className="text-xl cursor-pointer text-[#37332f] hover:opacity-80">&#33;</span>
                <div className="absolute -top-9 right-0 bg-[#908a80] text-[#37332f] text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {errors.email || (errorMessage && !errors.email && !errors.password && errorMessage)}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-[#37332f]">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="mt-1 block w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-all border-[#37332f] focus:ring-[#908a80] bg-white/20 text-[#37332f]"
              placeholder="Enter your password"
            />
            {(errors.password || (errorMessage && !errors.email && !errors.password)) && (
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 group ${shake ? "animate-shake" : ""}`}>
                <span className="text-xl cursor-pointer text-[#37332f] hover:opacity-80">&#33;</span>
                <div className="absolute -top-9 right-0 bg-[#908a80] text-[#37332f] text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {errors.password || errorMessage}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="w-full py-3 px-5 bg-[#37332f] text-white rounded-md hover:bg-[#2b2b28] focus:outline-none focus:ring-2 focus:ring-[#908a80]"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : isLogin ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>

        {/* Switch mode */}
        <div className="mt-5 text-center">
          <p className="text-sm text-[#37332f]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#2b2b28] hover:text-[#37332f] ml-1">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

        {/* Google login */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#37332f] mb-4">Or log in with</p>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Login Failed")}
            theme="outline"
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
