"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogleLogin = (response: CredentialResponse) => {
    console.log(response); // Handle Google login response
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="relative w-full max-w-md p-6 backdrop-blur-xl rounded-xl shadow-xl border border-[#37332f]">
        <div className="flex justify-center mb-4">
          <Image src="/logo/logo.png" alt="LitHub Logo" width={150} height={150} />
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#37332f]">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-3 border border-[#37332f] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#908a80] bg-white/30 text-[#37332f]"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#37332f]">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-3 border border-[#37332f] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#908a80] bg-white/30 text-[#37332f]"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="w-full py-3 px-5 bg-[#37332f] text-white rounded-md hover:bg-[#2b2b28] focus:outline-none focus:ring-2 focus:ring-[#908a80]"
            >
              {isLogin ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-[#37332f]">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#2b2b28] hover:text-[#37332f] ml-1"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#37332f] mb-4">Or log in with</p>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log('Login Failed')}
            theme="outline"
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
