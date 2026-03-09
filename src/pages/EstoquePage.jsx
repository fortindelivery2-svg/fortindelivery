import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Box, AlertTriangle, XCircle, CheckCircle, Edit, Search, X, Layers, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import EstoqueCard from '@/components/EstoqueCard';
import { supabase } from '@/lib/customSupabaseClient';
import { deleteProduct, restoreProduct } from '@/services/productService';
import { useAuth } from '@/contexts/AuthContext';
import { useCombos } from '@/hooks/useCombos';

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ id: null, nome: '', quantidade: '', observacao: '' });

  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchComboInsumos } = useCombos();

  const [deletingIds, setDeletingIds] = useState([]);

  // New state to store fetched combo details to avoid repetitive fetching
  const [comboDetails, setComboDetails] = useState({});

  useEffect(() => {
    if (user) {
      loadEstoque();
      const subscription = supabase.channel('estoque_changes').on('postgres_changes', {
        event: '*', schema: 'public', table: 'produtos', filter: `user_id=eq.${user.id}`
      }, () => { loadEstoque(); }).subscribe();
      return () => { subscription.unsubscribe(); };
    }
    // listen for completed sales to immediately refresh estoque
    const handler = async (e) => {
      try { await loadEstoque(); } catch (err) { console.error('Error refreshing estoque after sale:', err); }
    };
    window.addEventListener('venda.finalizada', handler);
    return () => { window.removeEventListener('venda.finalizada', handler); };
  }, [user]);

  const loadEstoque = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('produtos').select('*').eq('user_id', user.id).eq('ativo', true).order('descricao', { ascending: true });
      if (error) throw error;
      setProdutos(data || []);

      // Fetch details for combos
      const combos = data.filter(p => p.tipo === 'combo');
      const details = {};
      for (const combo of combos) {
        const insumos = await fetchComboInsumos(combo.id);
        details[combo.id] = insumos;
      }
      setComboDetails(details);

    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let result = produtos;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => p.descricao.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term) || p.categoria?.toLowerCase().includes(term));
    }
    if (activeFilter !== 'Todos') {
      if (activeFilter === 'Estoque baixo') { result = result.filter(p => p.tipo !== 'combo' && (p.estoque || 0) < (p.estoque_minimo || 0) && (p.estoque || 0) > 0); }
      else if (activeFilter === 'Zerado') { result = result.filter(p => p.tipo !== 'combo' && (p.estoque || 0) <= 0); }
      else if (activeFilter === 'Combos') { result = result.filter(p => p.tipo === 'combo'); }
    }
    setFilteredProdutos(result);
  }, [searchTerm, activeFilter, produtos]);

  const handleAdjustClick = (produto) => {
    if (produto.tipo === 'combo') {
      toast({ title: 'Ajuste não permitido', description: 'Combos não possuem estoque direto. Ajuste os insumos individualmente.', variant: 'destructive' });
      return;
    }
    setAdjustData({ id: produto.id, nome: produto.descricao, quantidade: produto.estoque, observacao: '' });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSave = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('produtos').update({ estoque: parseInt(adjustData.quantidade) }).eq('id', adjustData.id);
      if (error) throw error;
      toast({ title: 'Estoque atualizado!' });
      setIsAdjustModalOpen(false);
    } catch (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
  };

  const handleDeleteProduto = async (id) => {
    if (!window.confirm('Deseja realmente excluir este produto do estoque?')) return;
    setDeletingIds(prev => [...prev, id]);
    try {
      const previous = await deleteProduct(id, user.id);
      // Optimistically remove from local state to immediately update UI
      setProdutos(prev => prev.filter(p => p.id !== id));

      // Show toast with undo action
      toast({
        title: 'Produto removido (inativo)',
        description: 'Produto marcado como inativo e estoque zerado.',
        action: (
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              await restoreProduct(previous, user.id);
              await loadEstoque();
              toast({ title: 'Restaurado', description: 'Produto restaurado com sucesso.' });
            } catch (e) {
              console.error('Undo restore failed', e);
              toast({ title: 'Erro ao restaurar', description: e.message || e, variant: 'destructive' });
            }
          }}>Desfazer</Button>
        ),
      });

      // Ensure list is refreshed from server too
      loadEstoque();
    } catch (error) {
      console.error('Error deleting product from estoque:', error);
      toast({ title: 'Erro ao excluir', description: error.message || error, variant: 'destructive' });
    } finally {
      // remove id from deletingIds
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  };

  const totalProdutos = produtos.filter(p => p.tipo !== 'combo').length;
  const estoqueBaixo = produtos.filter(p => p.tipo !== 'combo' && (p.estoque || 0) < (p.estoque_minimo || 0)).length;
  const estoqueZerado = produtos.filter(p => p.tipo !== 'combo' && (p.estoque || 0) <= 0).length;
  const valorTotalEstoque = produtos.filter(p => p.tipo !== 'combo').reduce((acc, curr) => acc + (curr.estoque || 0) * (curr.valor_venda || 0), 0);

  const filters = [
    { label: 'Todos', activeColor: 'bg-[#00d084] text-white' },
    { label: 'Estoque baixo', activeColor: 'bg-[#FFA500] text-[#1a2332]' },
    { label: 'Zerado', activeColor: 'bg-[#EF4444] text-white' },
    { label: 'Combos', activeColor: 'bg-[#3B82F6] text-white' }
  ];

  return (
    <div className="p-6 space-y-6">
      <Helmet> <title>Estoque - Dashboard</title> </Helmet>

      <div> <h1 className="text-3xl font-bold text-white mb-2">Estoque</h1> <p className="text-gray-400">Visão geral e monitoramento</p> </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <EstoqueCard title="Produtos Simples" value={totalProdutos} icon={Box} color="#3b82f6" />
        <EstoqueCard title="Estoque baixo" value={estoqueBaixo} icon={AlertTriangle} color="#FFA500" />
        <EstoqueCard title="Estoque Zerado" value={estoqueZerado} icon={XCircle} color="#EF4444" />
        <EstoqueCard title="Valor em Estoque" value={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CheckCircle} color="#00d084" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-[#2d3e52] p-4 rounded-lg border border-gray-700">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#00d084] focus:outline-none" />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {filters.map(filter => <Button key={filter.label} onClick={() => setActiveFilter(filter.label)} variant={activeFilter === filter.label ? 'default' : 'outline'} className={`whitespace-nowrap ${activeFilter === filter.label ? filter.activeColor : 'bg-transparent text-gray-300 border-gray-600'}`}> {filter.label} </Button>)}
        </div>
      </div>

      <div className="bg-[#1a2332] rounded-lg overflow-hidden shadow-xl border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a2332] border-b border-gray-700">
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-400">CÓDIGO</th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-400">DESCRIÇÃO</th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-400">CATEGORIA</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-400">ESTOQUE</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-400">STATUS</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-400">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredProdutos.map(produto => {
                const isCombo = produto.tipo === 'combo';
                const qtd = parseFloat(produto.estoque) || 0;
                const min = parseFloat(produto.estoque_minimo) || 0;

                let badgeClass = 'bg-[#00d084] text-[#1a2332]';
                let statusText = 'OK';

                if (isCombo) {
                  badgeClass = 'bg-blue-600 text-white';
                  statusText = 'COMBO';
                } else if (qtd <= 0) {
                  badgeClass = 'bg-[#EF4444] text-white';
                  statusText = 'ZERADO';
                } else if (qtd < min) {
                  badgeClass = 'bg-[#FFA500] text-[#1a2332]';
                  statusText = 'BAIXO';
                }

                const insumosList = isCombo && comboDetails[produto.id]
                  ? comboDetails[produto.id].map(i => `${i.produto?.descricao} (${i.quantidade}${i.unidade_medida})`).join(', ')
                  : '';

                return (
                  <tr key={produto.id} className="hover:bg-[#2a3a4a]/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-400 font-mono">{produto.codigo}</td>
                    <td className="py-4 px-6 text-sm text-white font-medium">
                      {produto.descricao}
                      {isCombo && (
                        <div className="text-xs text-gray-500 flex flex-col mt-1">
                          <div className="flex items-center mb-1 text-gray-400">
                            <Layers className="w-3 h-3 mr-1" />
                            Contém:
                          </div>
                          {comboDetails[produto.id] && comboDetails[produto.id].length > 0 ? (
                            comboDetails[produto.id].map(ins => (
                              <div key={ins.id} className="flex justify-between text-xs text-gray-300">
                                <div className="truncate mr-4">{ins.produto?.descricao || 'Insumo'} x{ins.quantidade}{ins.unidade_medida ? ` ${ins.unidade_medida}` : ''}</div>
                                <div className="font-mono">{ins.produto?.estoque ?? 0}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400">{insumosList || 'Carregando insumos...'}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{produto.categoria}</td>
                    <td className="py-4 px-6 text-sm font-bold text-center text-[#00d084]">
                      {isCombo ? (
                        (() => {
                          const insumos = comboDetails[produto.id];
                          if (!insumos || insumos.length === 0) return 'Carregando...';
                          // compute how many full combos can be assembled
                          const availability = insumos.reduce((acc, ins) => {
                            try {
                              const stock = parseFloat(ins.produto?.estoque || 0);
                              const needed = parseFloat(ins.quantidade) || 1;
                              const canMake = Math.floor(stock / needed);
                              return acc === null ? canMake : Math.min(acc, canMake);
                            } catch (e) { return acc === null ? 0 : Math.min(acc, 0); }
                          }, null) ?? 0;
                          return `Disponível: ${availability}`;
                        })()
                      ) : qtd}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${badgeClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {!isCombo && (
                        <Button variant="ghost" size="sm" onClick={() => handleAdjustClick(produto)} className="text-blue-400 hover:text-blue-300 mr-2">
                          <Edit className="w-4 h-4 mr-2" /> Ajustar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduto(produto.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d3e52] rounded-lg w-full max-w-md p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6"> <h2 className="text-xl font-bold text-white">Ajustar Estoque</h2> <button onClick={() => setIsAdjustModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button> </div>
            <form onSubmit={handleAdjustSave} className="space-y-4">
              <input type="text" disabled value={adjustData.nome} className="w-full bg-[#1a2332] border border-gray-600 rounded px-3 py-2 text-gray-400" />
              <input type="number" required min="0" value={adjustData.quantidade} onChange={e => setAdjustData({ ...adjustData, quantidade: e.target.value })} className="w-full bg-[#1a2332] border border-gray-600 rounded px-3 py-2 text-white" placeholder="Nova Quantidade" />
              <textarea value={adjustData.observacao} onChange={e => setAdjustData({ ...adjustData, observacao: e.target.value })} className="w-full bg-[#1a2332] border border-gray-600 rounded px-3 py-2 text-white h-20 resize-none" placeholder="Observação" />
              <div className="flex justify-end gap-3 pt-4"> <Button type="button" variant="ghost" onClick={() => setIsAdjustModalOpen(false)} className="text-gray-300">Cancelar</Button> <Button type="submit" className="bg-[#00d084] text-white">Salvar</Button> </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EstoquePage;