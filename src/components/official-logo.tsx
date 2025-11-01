'use client';

import { cn } from "@/lib/utils";

export function OfficialLogo({ className }: { className?: string }) {
  const logoUrl = "https://storage.googleapis.com/studioprompt-res/11p2_3408013_1730870932.99/out-0.png";
  
  return (
    <div className={cn("relative", className)}>
      <img 
        src={logoUrl}
        alt="Official Seal of Bongabong"
        className="object-contain w-full h-full"
      />
    </div>
  );
}