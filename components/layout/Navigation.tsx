import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import companyLogo from "../../public/aisemble_transparent.png";

const UserInfoSkeleton = () => {
  return (
    <div className="flex items-center gap-3">
      {/* Avatar Skeleton */}
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      
      {/* User Info Skeleton */}
      <div className="hidden md:flex flex-col gap-1">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-2 w-16 bg-muted/50 rounded animate-pulse" />
      </div>
      
      {/* Dropdown Arrow Skeleton */}
      <div className="w-4 h-4 bg-muted rounded animate-pulse" />
    </div>
  );
};

function Navigation() {
  return (
    <header className="bg-secondary/20 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* <BrainCircuit className="h-8 w-8 text-primary" /> */}
          <Image src={companyLogo} alt="AIsemble Logo" width={50} height={50} />
          <h1 className="text-xl font-bold">
            <span className="text-[#e63946] dark:text-[#e63946]">AI</span>
            <span className="bg-gradient-to-r from-[#457b9d] to-[#1d3557] dark:from-white dark:to-white bg-clip-text text-transparent">
              semble
            </span>
          </h1>
          {/* <ThemeToggle /> */}
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#use-cases"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Use Cases
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <UserInfoSkeleton />
        </div>
      </div>
    </header>
  );
}

export default Navigation;