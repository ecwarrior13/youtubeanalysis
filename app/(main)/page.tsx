import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - AIsemble",
  description: "Your AI agent team management dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to your AI agent team management dashboard
      </p>
    </div>
  );
}
