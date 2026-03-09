import React, { useRef, useEffect } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentMethodCard = ({ 
  id, 
  method, 
  label, 
  icon: Icon, 
  color, 
  isActive, 
  onSelect, 
  value, // Only present if this card is being edited directly or represents an active input
  onChangeValue,
  onAddPayment
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddPayment();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-4 h-32
        ${isActive 
          ? `border-[${color}] bg-[${color}]/10 shadow-lg shadow-[${color}]/20` 
          : 'border-gray-700 bg-[#2a3a4a] hover:border-gray-600'
        }
      `}
      style={{ 
        borderColor: isActive ? color : undefined,
        backgroundColor: isActive ? `${color}1A` : undefined // 1A is ~10% opacity hex
      }}
      onClick={onSelect}
    >
      <Icon 
        className={`w-8 h-8 mb-2 transition-colors duration-300`}
        style={{ color: isActive ? color : '#9ca3af' }}
      />
      
      <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {label}
      </span>

      {/* Input Overlay when Active */}
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 bg-[#1a2332]/95 flex flex-col items-center justify-center p-2 z-10"
        >
           <div className="w-full relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
             <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#2a3a4a] border border-gray-600 rounded-md py-1 pl-8 pr-2 text-white text-center font-bold focus:border-[#00d084] focus:outline-none"
              placeholder="0.00"
              onClick={(e) => e.stopPropagation()}
            />
           </div>
           <button
             onClick={(e) => {
               e.stopPropagation();
               onAddPayment();
             }}
             className="mt-2 text-xs bg-[#00d084] text-white px-3 py-1 rounded-full hover:bg-[#00b872] flex items-center gap-1"
           >
             <Check className="w-3 h-3" /> Adicionar
           </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentMethodCard;