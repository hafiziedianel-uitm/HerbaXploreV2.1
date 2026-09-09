"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface UitmLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UitmLogo({ className = "h-10 sm:h-12 w-auto", size = 'md' }: UitmLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Official UiTM Shield & Typography Vector Fallback
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <svg 
          viewBox="0 0 100 110" 
          className="h-full w-auto shrink-0 drop-shadow-xs" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield - Royal Purple */}
          <path 
            d="M50 5 L88 20 C88 65 50 100 50 100 C50 100 12 65 12 20 Z" 
            fill="#3b0764" 
            stroke="#d97706" 
            strokeWidth="3.5"
          />
          {/* Inner Golden Crown / Crest Motif */}
          <path 
            d="M30 42 L50 24 L70 42 L62 48 L50 36 L38 48 Z" 
            fill="#f59e0b"
          />
          {/* Core Open Book of Knowledge */}
          <path 
            d="M32 54 C42 50 50 55 50 55 C50 55 58 50 68 54 C66 68 58 72 50 72 C42 72 34 68 32 54 Z" 
            fill="#ffffff"
          />
          <line x1="50" y1="55" x2="50" y2="72" stroke="#3b0764" strokeWidth="2" />
          {/* Base Red Ribbon Accent */}
          <path 
            d="M26 80 Q50 88 74 80 L76 86 Q50 94 24 86 Z" 
            fill="#dc2626"
          />
        </svg>

        <div className="flex flex-col justify-center leading-tight">
          <span className="font-serif font-black text-purple-950 dark:text-purple-900 tracking-wider text-base sm:text-lg">
            UiTM
          </span>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold tracking-tight text-stone-700 uppercase font-sans">
            UNIVERSITI TEKNOLOGI MARA
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image 
      src="/uitm-logo.png?v=2" 
      alt="UiTM Universiti Teknologi MARA Logo" 
      width={size === 'sm' ? 120 : size === 'lg' ? 240 : 180} 
      height={size === 'sm' ? 45 : size === 'lg' ? 90 : 68} 
      unoptimized
      className={`${className} object-contain`}
      onError={() => setHasError(true)}
      priority
    />
  );
}
