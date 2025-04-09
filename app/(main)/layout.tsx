import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard - AIsemble",
  description: "Your AI agent team management dashboard",
};

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will go here */}
      <main className="flex-1">
        {/* Header will go here */}
        <div className="container mx-auto p-4">{children}</div>
      </main>
    </div>
  );
}
