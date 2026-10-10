import React from 'react';
import clsx from 'clsx';

interface RimalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  glass?: boolean;
}

export default function RimalCard({ children, className, noPadding, glass, ...props }: RimalCardProps) {
  return (
    <div 
      className={clsx(
        "bg-white rounded-[24px] overflow-hidden transition-all duration-300",
        glass ? "shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 backdrop-blur-xl" : "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border-0",
        !noPadding && "p-7",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
