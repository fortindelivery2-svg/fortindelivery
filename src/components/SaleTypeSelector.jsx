import React from 'react';
import { Store, Bike } from 'lucide-react';
import { motion } from 'framer-motion';

const SaleTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div className="flex items-center gap-4 w-full">
      <button
        onClick={() => onSelect('loja')}
        className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
          selectedType === 'loja'
            ? 'bg-[#00d084]/10 border-[#00d084] text-white'
            : 'bg-[#1a2332] border-gray-700 text-gray-400 hover:border-gray-600'
        }`}
      >
        <Store className={`w-5 h-5 ${selectedType === 'loja' ? 'text-[#00d084]' : 'text-gray-500'}`} />
        <span className={`font-bold uppercase tracking-wider ${selectedType === 'loja' ? 'text-[#00d084]' : 'text-gray-400'}`}>
          Loja
        </span>
        {selectedType === 'loja' && (
          <motion.div
            layoutId="activeType"
            className="absolute inset-0 border-2 border-[#00d084] rounded-lg"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>

      <button
        onClick={() => onSelect('delivery')}
        className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
          selectedType === 'delivery'
            ? 'bg-[#00d084]/10 border-[#00d084] text-white'
            : 'bg-[#1a2332] border-gray-700 text-gray-400 hover:border-gray-600'
        }`}
      >
        <Bike className={`w-5 h-5 ${selectedType === 'delivery' ? 'text-[#00d084]' : 'text-gray-500'}`} />
        <span className={`font-bold uppercase tracking-wider ${selectedType === 'delivery' ? 'text-[#00d084]' : 'text-gray-400'}`}>
          Delivery
        </span>
        {selectedType === 'delivery' && (
          <motion.div
            layoutId="activeType"
            className="absolute inset-0 border-2 border-[#00d084] rounded-lg"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
};

export default SaleTypeSelector;