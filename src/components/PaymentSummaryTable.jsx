import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentSummaryTable = ({ payments, onRemove, onEdit, subtotal = 0, discount = 0, surcharge = 0, total = 0 }) => {
  
  const getMethodLabel = (method) => {
    const labels = {
      dinheiro: 'Dinheiro',
      debito: 'Cartão Débito',
      credito: 'Cartão Crédito',
      pix: 'Pix',
      fiado: 'Fiado',
      consumo: 'Consumo Interno'
    };
    return labels[method] || method;
  };

  const getMethodColor = (method) => {
      const colors = {
      dinheiro: '#00d084',
      debito: '#8B5CF6',
      credito: '#F97316',
      pix: '#3B82F6',
      fiado: '#FFA500',
      consumo: '#6B7280'
    };
    return colors[method] || '#9ca3af';
  };

  return (
    <div className="bg-[#2a3a4a] rounded-lg border border-gray-700 overflow-hidden flex flex-col h-full">
      
      {/* Table Body - Payment List */}
      <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
             <span className="opacity-50 text-3xl mb-2">💸</span>
             <span>Nenhum pagamento registrado</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a2332] text-gray-400 text-xs uppercase sticky top-0 z-10">
                <th className="py-2 px-4 text-left">Forma</th>
                <th className="py-2 px-4 text-right">Valor</th>
                <th className="py-2 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {payments.map((payment) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="border-t border-gray-700 hover:bg-[#324255]/50 transition-colors"
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getMethodColor(payment.method) }}
                      />
                      <span className="text-white font-medium text-sm">
                        {getMethodLabel(payment.method)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300 font-mono text-sm">
                      R$ {payment.value.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onRemove(payment.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                        title="Remover pagamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-[#1a2332] border-t border-gray-600 p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal:</span>
          <span className="text-gray-200">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-red-400">Desconto:</span>
            <span className="text-red-400 font-medium">-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        
        {surcharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#00d084]">Acréscimo:</span>
            <span className="text-[#00d084] font-medium">+R$ {surcharge.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-700 mt-2">
          <span className="text-white">Total:</span>
          <span className="text-[#00d084]">R$ {total.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
};

export default PaymentSummaryTable;