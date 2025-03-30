"use client"

import { NextPage } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthForm from '../components/AuthForm';

const LoginPage: NextPage = () => {
  return (
    <GoogleOAuthProvider clientId="618849936695-h6uivhp48jj5n5sekn92le32i0rtjc6u.apps.googleusercontent.com">
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