import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, History, Search } from 'lucide-react';

const TableSection = ({ title, icon: Icon, children }) => (
  <div className="bg-[#2a3a4a] rounded-lg border border-gray-700 overflow-hidden flex flex-col h-full">
    <div className="p-4 border-b border-gray-700 bg-[#324255] flex items-center gap-2">
      <Icon className="w-5 h-5 text-[#00d084]" />
      <h3 className="font-bold text-white">{title}</h3>
    </div>
    <div className="overflow-x-auto flex-1 custom-scrollbar">
      {children}
    </div>
  </div>
);

const ProductTable = ({ products, type }) => (
  <table className="w-full text-sm">
    <thead className="bg-[#1a2332] text-gray-400">
      <tr>
        <th className="py-2 px-4 text-left font-medium">Produto</th>
        <th className="py-2 px-4 text-center font-medium">Qtd</th>
        <th className="py-2 px-4 text-right font-medium">Total</th>
        <th className="py-2 px-4 text-right font-medium">Lucro</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-700">
      {products.length === 0 ? (
        <tr><td colSpan="4" className="py-8 text-center text-gray-500">Sem dados</td></tr>
      ) : (
        products.map((p, i) => (
          <tr key={i} className="hover:bg-[#324255]/50 transition-colors">
            <td className="py-3 px-4">
              <div className="text-white font-medium">{p.descricao}</div>
              <div className="text-xs text-gray-500">{p.codigo}</div>
            </td>
            <td className={`py-3 px-4 text-center font-bold ${type === 'top' ? 'text-[#00d084]' : 'text-yellow-500'}`}>
              {p.quantidade}
            </td>
            <td className="py-3 px-4 text-right text-gray-300">
              R$ {p.valorTotal.toFixed(2)}
            </td>
            <td className="py-3 px-4 text-right text-blue-400">
              R$ {p.lucro.toFixed(2)}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

const RelatorioTabelas = ({ maisVendidos, menosVendidos, historicoVendas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredHistory = historicoVendas.filter(v => 
    v.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendedor_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSection title="Mais Vendidos (Top 5)" icon={ArrowUpRight}>
          <ProductTable products={maisVendidos} type="top" />
        </TableSection>
        
        <TableSection title="Menos Vendidos (Bottom 5)" icon={ArrowDownRight}>
          <ProductTable products={menosVendidos} type="bottom" />
        </TableSection>
      </div>

      <div className="bg-[#2a3a4a] rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-[#324255] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#00d084]" />
            <h3 className="font-bold text-white">Histórico Recente</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar cliente ou vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1a2332] text-sm text-white rounded-md pl-9 pr-3 py-2 border border-gray-600 focus:border-[#00d084] outline-none w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a2332] text-gray-400">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Data/Hora</th>
                <th className="py-3 px-4 text-left font-medium">Cliente</th>
                <th className="py-3 px-4 text-left font-medium">Vendedor</th>
                <th className="py-3 px-4 text-left font-medium">Pagamento</th>
                <th className="py-3 px-4 text-right font-medium">Total</th>
                <th className="py-3 px-4 text-right font-medium">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedHistory.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Nenhuma venda encontrada</td></tr>
              ) : (
                paginatedHistory.map((venda) => (
                  <tr key={venda.id} className="hover:bg-[#324255]/50 transition-colors">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(venda.data_hora).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{venda.cliente_nome}</td>
                    <td className="py-3 px-4 text-gray-400">{venda.vendedor_nome}</td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{venda.forma_pagamento}</td>
                    <td className="py-3 px-4 text-right text-[#00d084] font-bold">
                      R$ {Number(venda.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">
                      R$ {venda.lucro.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-700 flex justify-center gap-2">
             <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-[#1a2332] text-gray-300 disabled:opacity-50 hover:bg-[#324255]"
            >
              Anterior
            </button>
            <span className="text-gray-400 py-1">Página {page} de {totalPages}</span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-[#1a2332] text-gray-300 disabled:opacity-50 hover:bg-[#324255]"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatorioTabelas;