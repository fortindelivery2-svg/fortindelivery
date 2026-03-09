import React from 'react';
import { cn } from '@/lib/utils';

const EstoqueCard = ({ title, value, icon: Icon, color, backgroundColor, className }) => {
  return (
    <div 
      className={cn("bg-[#2d3e52] rounded-lg shadow-lg p-6 flex items-center justify-between transition-transform hover:scale-105", className)}
      style={{ backgroundColor: backgroundColor || '#2d3e52' }}
    >
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide">{title}</p>
        <h3 
          className="text-2xl font-bold"
          style={{ color: title.includes("Valor") ? '#00d084' : (color || 'white') }}
        >
          {value}
        </h3>
      </div>
      <div 
        className="p-3 rounded-full flex items-center justify-center shadow-inner" 
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-8 h-8" style={{ color: color }} />
      </div>
    </div>
  );
};

export default EstoqueCard;