import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Sign Up - AIsemble",
  description: "Create your AIsemble account",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
        </div>
      </div>
    </div>
  );
}
