import React, { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MotoboysTable = ({ motoboys, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(motoboys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMotoboys = motoboys.slice(startIndex, startIndex + itemsPerPage);

  const formatPhone = (phone) => {
    if (!phone) return '-';
    // Simple formatter if not strictly enforced in DB
    return phone; 
  };

  return (
    <div className="bg-[#1a2332] rounded-lg shadow-lg border border-gray-700 flex flex-col h-full">
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#232f3e] sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">Nome / CPF</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">Contato</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700">Veículo / Placa</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 text-center">Comissão</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 text-center">Status</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedMotoboys.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Bike className="w-8 h-8 opacity-20" />
                    <p>Nenhum motoboy encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMotoboys.map((moto) => (
                <tr 
                  key={moto.id} 
                  className="hover:bg-[#2a3a4a] transition-colors group"
                >
                  <td className="p-4">
                    <div className="font-medium text-white">{moto.nome}</div>
                    <div className="text-xs text-gray-500 font-mono">{moto.cpf}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300">{formatPhone(moto.telefone)}</div>
                    {moto.email && <div className="text-xs text-gray-500">{moto.email}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <Bike className="w-3 h-3 text-[#00d084]" />
                      {moto.veiculo}
                    </div>
                    <div className="text-xs text-gray-500 font-mono uppercase bg-black/20 px-1 rounded inline-block mt-1 border border-gray-700">
                      {moto.placa}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-sm text-[#00d084] font-bold">{moto.comissao_percentual}%</div>
                    {moto.comissao_fixa > 0 && (
                      <div className="text-xs text-gray-400">
                        + R$ {Number(moto.comissao_fixa).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      moto.status === 'ativo' 
                        ? 'bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/30' 
                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                    }`}>
                      {moto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(moto)}
                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(moto)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 flex items-center justify-between bg-[#232f3e] rounded-b-lg">
          <span className="text-xs text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 border-gray-600 bg-transparent text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 border-gray-600 bg-transparent text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MotoboysTable;