import { cn } from "@/lib/utils";
import Image from "next/image";

export function OfficialLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="https://storage.googleapis.com/studioprompt-res/11p2_3408013_1730870932.99/out-0.png"
        alt="Official Seal of Bongabong"
        fill
        className="object-contain"
      />
    </div>
  );
}
