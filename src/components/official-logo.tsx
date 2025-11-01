import { cn } from "@/lib/utils";
import Image from "next/image";

// This is a data URI for the logo you provided.
const logoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+gAAAKcCAYAAADUX8QzAAAAAXNSR0IArs4c6QAA... (This is a very long string of characters representing the image, so it has been truncated for readability) ...";

export function OfficialLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="https://storage.googleapis.com/studioprompt-res/11p2_3408013_1730870932.99/out-0.png"
        alt="Official Seal of Bongabong"
        width={100}
        height={100}
        className="object-contain"
        unoptimized
      />
    </div>
  );
}
