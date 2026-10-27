import React from 'react';

export default function CardView({
  card,
  isFaceDown = false,
  isSelected = false,
  isPlayable = false,
  onClick,
  size = 'md'
}) {
  // Dimensions based on size
  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-16 h-24 text-sm sm:w-20 sm:h-28 sm:text-base',
    lg: 'w-20 h-28 text-base sm:w-24 sm:h-36 sm:text-lg'
  }[size] || 'w-16 h-24 text-sm sm:w-20 sm:h-28 sm:text-base';

  if (isFaceDown) {
    return (
      <div
        className={`${sizeClasses} rounded-lg border-2 border-indigo-400/50 bg-gradient-to-br from-indigo-800 to-indigo-950 shadow-md flex items-center justify-center select-none relative overflow-hidden`}
      >
        <div className="w-full h-full opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
        <span className="absolute text-indigo-300/60 font-black text-xs sm:text-sm tracking-widest">
          NATIS
        </span>
      </div>
    );
  }

  if (!card) return null;

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const isJoker = card.isJoker;

  const suitColorClass = isJoker
    ? 'text-purple-600'
    : isRed
    ? 'text-rose-600'
    : 'text-slate-900';

  return (
    <div
      onClick={onClick}
      className={`${sizeClasses} bg-white rounded-lg border border-slate-300 shadow-md select-none relative p-1.5 flex flex-col justify-between transition-all duration-150 ${suitColorClass} ${
        isPlayable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-indigo-500' : ''
      } ${isSelected ? '-translate-y-3 ring-2 ring-indigo-500 shadow-xl' : ''}`}
    >
      {/* Top Left Corner */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-extrabold text-xs sm:text-sm">
          {isJoker ? 'JK' : card.label}
        </span>
        <span className="text-[10px] sm:text-xs">
          {card.symbol}
        </span>
      </div>

      {/* Center Symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-2xl sm:text-3xl font-bold opacity-90">
          {card.symbol}
        </span>
      </div>

      {/* Bottom Right Corner (Inverted) */}
      <div className="flex flex-col items-center leading-none rotate-180 self-end">
        <span className="font-extrabold text-xs sm:text-sm">
          {isJoker ? 'JK' : card.label}
        </span>
        <span className="text-[10px] sm:text-xs">
          {card.symbol}
        </span>
      </div>
    </div>
  );
}
