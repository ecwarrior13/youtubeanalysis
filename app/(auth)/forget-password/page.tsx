import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Forgot Password - AIsemble",
  description: "Reset your password to regain access to your account",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
        </div>
      </div>
    </div>
  );
}
