import React from 'react';

interface PhysicalButtonProps {
  label?: string;
  subLabel?: string;
  onClick: () => void;
  color?: 'red' | 'yellow';
  shape?: 'circle' | 'pill' | 'rect';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  extraLargeText?: boolean; // To explicitly boost text size to 180%
  largeText?: boolean; // To explicitly boost text size to 150%
}

const PhysicalButton: React.FC<PhysicalButtonProps> = ({ 
  label, 
  subLabel, 
  onClick, 
  color = 'red', 
  shape = 'circle', 
  size = 'md', 
  className = '',
  disabled = false,
  extraLargeText = false,
  largeText = false
}) => {
  
  const baseStyles = "relative flex flex-col items-center justify-center transition-transform active:scale-95 active:shadow-inner select-none";
  
  const colorStyles = color === 'red' 
    ? "bg-[#D32F2F] shadow-[0_4px_0_#8e0000]"
    : "bg-[#B8860B] shadow-[0_4px_0_#705206]"; 

  const shapeStyles = shape === 'circle' 
    ? "rounded-full" 
    : shape === 'pill'
    ? "rounded-full aspect-[2/1]" 
    : "rounded-lg";

  // Dimensions
  const sizeStyles = {
    // Increased sm size slightly to fit text better, adjusted text size
    sm: "w-14 h-14 text-sm sm:text-base", 
    // Reverted md circle to standard size to prevent overflow
    md: "w-16 h-16 text-xl", 
    lg: "w-24 h-24 text-2xl",
  };

  const dimensions = shape === 'pill' 
    ? (size === 'md' ? 'w-28 h-14' : 'w-20 h-10') 
    : sizeStyles[size];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {subLabel && <span className="text-[#C5A005] font-bold text-xs sm:text-sm uppercase tracking-wider drop-shadow-sm whitespace-nowrap">{subLabel}</span>}
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            ${baseStyles}
            ${colorStyles}
            ${shapeStyles}
            ${dimensions}
            ${disabled ? 'opacity-40 cursor-not-allowed translate-y-[4px] shadow-none' : 'cursor-pointer'}
        `}
      >
        {/* Reflection */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3/4 h-[30%] bg-white opacity-10 rounded-full blur-[1px]"></div>
        
        {/* Label */}
        {label && (
            <span 
                className="font-bold text-gray-200 drop-shadow-md z-10 text-center leading-none tracking-tighter"
                style={{
                    fontSize: extraLargeText ? '180%' : largeText ? '150%' : undefined
                }}
            >
                {label}
            </span>
        )}
      </button>
    </div>
  );
};

export default PhysicalButton;