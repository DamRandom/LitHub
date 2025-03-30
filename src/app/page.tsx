"use client"

import { NextPage } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthForm from '../components/AuthForm';

const LoginPage: NextPage = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/images/background.jpg)' }} />
        <div className="relative w-full max-w-md p-6">
          <AuthForm />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
