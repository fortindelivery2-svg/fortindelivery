import React, { useState } from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const FuncionariosTable = ({ funcionarios, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(funcionarios.length / itemsPerPage);
  const currentData = funcionarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-[#1a2332] rounded-lg border border-gray-700 overflow-hidden flex flex-col h-full shadow-xl">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full">
          <thead className="bg-[#2d3e52] sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Telefone</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cargo</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Admissão</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              currentData.map((func) => (
                <tr key={func.id} className="hover:bg-[#2d3e52]/30 transition-colors">
                  <td className="py-4 px-4 text-white font-medium text-sm">{func.nome}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{func.email}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{func.telefone || '-'}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{func.cargo}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">
                    {func.data_admissao ? format(new Date(func.data_admissao), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      func.status === 'ativo' 
                        ? 'bg-[#00d084]/10 text-[#00d084]' 
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {func.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      onClick={() => onEdit(func)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => onDelete(func)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 bg-[#2d3e52] flex justify-between items-center">
          <span className="text-sm text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuncionariosTable;