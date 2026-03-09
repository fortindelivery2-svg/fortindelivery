import React from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RelatorioFiltros = ({ startDate, endDate, onStartDateChange, onEndDateChange, onFilter, onReset, loading }) => {
  return (
    <div className="bg-[#2a3a4a] p-4 rounded-lg border border-gray-700 mb-6 animate-in slide-in-from-top-2">
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-2 text-white font-medium">
          <Filter className="w-5 h-5 text-[#00d084]" />
          <span>Filtros de Período</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full sm:w-auto bg-[#1a2332] text-white text-sm rounded-md pl-9 pr-3 py-2 border border-gray-600 focus:border-[#00d084] outline-none transition-colors"
              />
            </div>
            <span className="text-gray-400 text-sm">até</span>
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full sm:w-auto bg-[#1a2332] text-white text-sm rounded-md pl-9 pr-3 py-2 border border-gray-600 focus:border-[#00d084] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              onClick={onFilter}
              disabled={loading}
              className="bg-[#00d084] hover:bg-[#00b872] text-white flex-1 sm:flex-none h-9"
            >
              {loading ? 'Atualizando...' : 'Filtrar'}
            </Button>
            
            <Button 
              onClick={onReset}
              variant="outline"
              className="bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 flex-1 sm:flex-none h-9"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioFiltros;