import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Sign In - AIsemble",
  description: "Sign in to your AIsemble account",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to your account
          </h1>
        </div>
      </div>
    </div>
  );
}
