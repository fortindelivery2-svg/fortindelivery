import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Filter, RefreshCw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useSalesHistory } from '@/hooks/useSalesHistory';
import SalesHistoryTable from '@/components/SalesHistoryTable';
import EditSaleModal from '@/components/EditSaleModal';
import DeleteSaleConfirmation from '@/components/DeleteSaleConfirmation';
import PrintReportModal from '@/components/PrintReportModal';

const HistoricoVendasPage = () => {
  // Filter States
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoVenda, setTipoVenda] = useState('todos');
  const [status, setStatus] = useState('todos');

  // Modals State
  const [editingSale, setEditingSale] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Hook
  const { 
    sales, 
    loading, 
    fetchSalesWithFilters, 
    updateSale, 
    deleteSale,
    getSalesSummary
  } = useSalesHistory();

  // Initial Fetch
  useEffect(() => {
    handleFilter();
  }, []); 

  const handleFilter = () => {
    fetchSalesWithFilters({
      startDate,
      endDate,
      searchTerm,
      tipoVenda,
      status
    });
  };

  const handleClearFilters = () => {
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    setSearchTerm('');
    setTipoVenda('todos');
    setStatus('todos');
    // We can trigger fetch immediately or wait for user to click Filter again
    // Usually better UX to fetch immediately on reset
    setTimeout(() => {
       fetchSalesWithFilters({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        searchTerm: '',
        tipoVenda: 'todos',
        status: 'todos'
      });
    }, 100);
  };

  const { totalSales, totalRevenue, averageTicket, totalItems } = getSalesSummary();

  return (
    <div className="p-6 min-h-screen bg-[#0f1419] animate-in fade-in duration-500">
      <Helmet>
        <title>Histórico de Vendas - FORTIN ERP PRO</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico de Vendas</h1>
          <p className="text-gray-400">Consulte, gerencie e imprima relatórios de vendas</p>
        </div>
        <Button 
          onClick={() => setShowPrintModal(true)}
          className="bg-[#2d3e52] hover:bg-[#384b63] text-white border border-gray-600"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Relatórios
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-xs uppercase font-bold">Vendas Totais</span>
          <div className="text-2xl font-bold text-white mt-1">{totalSales}</div>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-xs uppercase font-bold">Faturamento</span>
          <div className="text-2xl font-bold text-[#00d084] mt-1">R$ {totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-xs uppercase font-bold">Ticket Médio</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">R$ {averageTicket.toFixed(2)}</div>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-xs uppercase font-bold">Itens Vendidos</span>
          <div className="text-2xl font-bold text-orange-400 mt-1">{totalItems}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a2332] p-4 rounded-lg border border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="text-xs text-gray-400 mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Nº pedido ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2d3e52] border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-[#00d084] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Período</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#2d3e52] border border-gray-600 rounded-lg px-2 py-2 text-white text-sm focus:border-[#00d084] focus:outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#2d3e52] border border-gray-600 rounded-lg px-2 py-2 text-white text-sm focus:border-[#00d084] focus:outline-none"
              />
            </div>
          </div>

          <div>
             <label className="text-xs text-gray-400 mb-1 block">Tipo de Venda</label>
             <select 
              value={tipoVenda}
              onChange={(e) => setTipoVenda(e.target.value)}
              className="w-full bg-[#2d3e52] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00d084] focus:outline-none"
             >
               <option value="todos">Todos</option>
               <option value="loja">Loja</option>
               <option value="delivery">Delivery</option>
             </select>
          </div>

          <div>
             <label className="text-xs text-gray-400 mb-1 block">Status</label>
             <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#2d3e52] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00d084] focus:outline-none"
             >
               <option value="todos">Todos</option>
               <option value="completa">Completa</option>
               <option value="cancelado">Cancelada</option>
             </select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleFilter}
              disabled={loading}
              className="flex-1 bg-[#00d084] hover:bg-[#00b872] text-white font-bold"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
              FILTRAR
            </Button>
            <Button 
              onClick={handleClearFilters}
              disabled={loading}
              variant="outline"
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              LIMPAR
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="h-[calc(100vh-400px)] min-h-[400px]">
        <SalesHistoryTable 
          sales={sales}
          onEdit={(sale) => setEditingSale(sale)}
          onDelete={(sale) => setDeletingSale(sale)}
        />
      </div>

      {/* Modals */}
      <EditSaleModal 
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        sale={editingSale}
        onSave={updateSale}
      />

      <DeleteSaleConfirmation 
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        sale={deletingSale}
        onConfirm={deleteSale}
      />

      <PrintReportModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        salesData={sales} // Pass current filtered sales
      />

    </div>
  );
};

export default HistoricoVendasPage;