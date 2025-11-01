'use client';

import { cn } from "@/lib/utils";

export function OfficialLogo({ className }: { className?: string }) {
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bongabong%2C_Oriental_Mindoro_Official_Seal.png";
  
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
