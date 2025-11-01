'use client';

import { cn } from "@/lib/utils";

export function OfficialLogo({ className }: { className?: string }) {
  // SVG representation of the Bongabong, Oriental Mindoro Official Seal
  return (
    <div className={cn("relative", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 800"
        className="object-contain w-full h-full"
        aria-label="Official Seal of Bongabong, Oriental Mindoro"
      >
        <circle cx="400" cy="400" r="380" fill="#fff" stroke="#000" strokeWidth="4" />
        <circle cx="400" cy="400" r="320" fill="none" stroke="#006400" strokeWidth="60" />
        <circle cx="400" cy="400" r="250" fill="#fff" stroke="#ffd700" strokeWidth="4" />
        
        <text 
            x="400" 
            y="130" 
            fontFamily="Arial, sans-serif" 
            fontSize="50" 
            fill="#000" 
            textAnchor="middle" 
            fontWeight="bold">
            SAGISAG NG BAYAN NG BONGABONG
        </text>
        <text 
            x="400" 
            y="720" 
            fontFamily="Arial, sans-serif" 
            fontSize="50" 
            fill="#000" 
            textAnchor="middle" 
            fontWeight="bold">
            LALAWIGAN NG SILANGANG MINDORO
        </text>
        
        <path d="M 250,400 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0" fill="#87ceeb" />
        
        <polygon points="400,200 280,350 520,350" fill="#228b22" />
        <polygon points="400,600 280,450 520,450" fill="#deb887" />
        
        <text x="400" y="310" fontSize="30" textAnchor="middle" fill="#fff" fontWeight="bold">1927</text>
        
        <path d="M 350,450 L 450,450 L 400,550 Z" fill="#a52a2a" />
        
        <text x="400" y="420" fontSize="120" textAnchor="middle" fill="#ffd700" fontWeight="bold">B</text>

        <g transform="translate(140, 140)">
            <path d="M0,0-5,5M5,0,0,5" stroke="#ffd700" strokeWidth="8"/>
        </g>
         <g transform="translate(660, 140)">
            <path d="M0,0-5,5M5,0,0,5" stroke="#ffd700" strokeWidth="8"/>
        </g>
         <g transform="translate(140, 660)">
            <path d="M0,0-5,5M5,0,0,5" stroke="#ffd700" strokeWidth="8"/>
        </g>
         <g transform="translate(660, 660)">
            <path d="M0,0-5,5M5,0,0,5" stroke="#ffd700" strokeWidth="8"/>
        </g>
      </svg>
    </div>
  );
}
