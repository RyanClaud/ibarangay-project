'use client';

import { cn } from "@/lib/utils";

export function OfficialLogo({ className }: { className?: string }) {
  // SVG representation of the Bongabong, Oriental Mindoro Official Seal
  return (
    <div className={cn("relative", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        className="object-contain w-full h-full"
        aria-label="Official Seal of Bongabong, Oriental Mindoro"
      >
        <circle cx="500" cy="500" r="490" fill="#00652e"/>
        <circle cx="500" cy="500" r="450" fill="white" stroke="#00652e" strokeWidth="2"/>
        
        <defs>
            <path id="circlePathUpper" d="M 250, 500 A 250,250 0 1 1 750,500" fill="transparent" />
            <path id="circlePathLower" d="M 750, 500 A 250,250 0 1 1 250,500" fill="transparent" />
        </defs>
        
        <text fill="#00652e" fontSize="70" fontWeight="bold" letterSpacing="4">
            <textPath href="#circlePathUpper" startOffset="50%" textAnchor="middle">
                BAYAN NG BONGABONG
            </textPath>
        </text>

        <text fill="#00652e" fontSize="55" fontWeight="bold" letterSpacing="2">
            <textPath href="#circlePathLower" startOffset="50%" textAnchor="middle">
                LALAWIGAN NG SILANGANG MINDORO
            </textPath>
        </text>
        
        <circle cx="500" cy="500" r="380" fill="#fec93e" />
        <circle cx="500" cy="500" r="370" fill="white" stroke="#00652e" strokeWidth="2"/>
        
        <path d="M500 240 L700 450 L300 450 Z" fill="#00a358" stroke="black" strokeWidth="2"/>
        
        <path d="M300 450 H 700 V 750 H 300 Z" fill="#75d1f5" stroke="black" strokeWidth="2"/>
        <path d="M300 750 Q 500 650 700 750 H 300 Z" fill="#fec93e"/>
        <text x="500" y="550" textAnchor="middle" fill="black" fontSize="40" fontWeight="bold">Palayan at Ilog</text>

        <text x="500" y="680" textAnchor="middle" fill="black" fontSize="100" fontWeight="bold">B</text>

        <text x="500" y="290" textAnchor="middle" fill="black" fontSize="30" fontWeight="bold">1927</text>

        <g fill="#fec93e" stroke="black" strokeWidth="2">
            <path d="M150 150 L180 180 L150 210 L120 180 Z"/>
            <path d="M850 150 L880 180 L850 210 L820 180 Z"/>
            <path d="M150 850 L180 820 L150 790 L120 820 Z"/>
            <path d="M850 850 L880 820 L850 790 L820 820 Z"/>
        </g>

        <text x="500" y="940" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">OPISYAL NA SAGISAG</text>

      </svg>
    </div>
  );
}
