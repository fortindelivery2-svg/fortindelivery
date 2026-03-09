import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Bike,
  ChartNoAxesCombined,
  Package,
  Printer,
  Save,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ModuleShell from '@/components/delivery/ModuleShell';
import MetricCard from '@/components/delivery/MetricCard';
import PanelCard from '@/components/delivery/PanelCard';
import StatusBadge from '@/components/delivery/StatusBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDeliveryHub } from '@/hooks/useDeliveryHub';
import { deliveryFormatting, formatOrderForPrint } from '@/services/deliveryHubService';
import { printOrder } from '@/utils/printOrder';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { key: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { key: 'produtos', label: 'Produtos', icon: Package },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'motoboys', label: 'Motoboys', icon: Bike },
  { key: 'bairros', label: 'Bairros de entrega', icon: Store },
  { key: 'configuracoes', label: 'Configurações', icon: Settings },
];

const emptyBairro = { id: '', nome: '', taxaEntrega: '', tempoMedio: '' };

const getLocalDateKey = (dateValue) => {
  const date = new Date(dateValue || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const isAcceptedOrder = (order) => !['Novo pedido', 'Cancelado'].includes(order.status);

const PainelLojaPage = () => {
  const { toast } = useToast();
  const {
    snapshot,
    summaries,
    togglePublishedProduct,
    saveBairrosEntrega,
    saveAppSettings,
    reserveOrderStock,
    updateOrderStatus,
    assignOrderToMotoboy,
    finalizeOrder,
  } = useDeliveryHub();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [bairroDraft, setBairroDraft] = useState(emptyBairro);
  const [savingBairro, setSavingBairro] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [appInfoDraft, setAppInfoDraft] = useState(snapshot.settings?.appInfo || {});

  useEffect(() => {
    setAppInfoDraft(snapshot.settings?.appInfo || {});
  }, [snapshot.settings]);

  const clientsRows = summaries.clientesApp;
  const bairrosAtivos = snapshot.settings?.bairros || [];
  const publishedIds = snapshot.settings?.publishedProductIds || [];
  const storeOrders = useMemo(
    () => snapshot.orders.filter((order) => order.origem === 'app'),
    [snapshot.orders],
  );

  const dashboardMetrics = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const ordersToday = storeOrders.filter((order) => getLocalDateKey(order.createdAt) === today);
    const acceptedOrdersToday = ordersToday.filter(isAcceptedOrder);

    return {
      pedidosHoje: ordersToday.length,
      valorHoje: acceptedOrdersToday.reduce((sum, order) => sum + Number(order.total || 0), 0),
      emPreparacao: storeOrders.filter((order) =>
        String(order.status || '').toLowerCase().includes('prepara'),
      ).length,
      entregues: storeOrders.filter((order) => order.status === 'Entregue').length,
    };
  }, [storeOrders]);

  const chartData = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const hourMap = new Map();

    storeOrders
      .filter((order) => getLocalDateKey(order.createdAt) === today)
      .filter(isAcceptedOrder)
      .forEach((order) => {
        const date = new Date(order.createdAt || Date.now());
        const label = `${String(date.getHours()).padStart(2, '0')}:00`;
        const current = hourMap.get(label) || { hora: label, pedidos: 0, valor: 0 };
        current.pedidos += 1;
        current.valor += Number(order.total || 0);
        hourMap.set(label, current);
      });

    const data = [...hourMap.values()].sort((a, b) => a.hora.localeCompare(b.hora));
    return data.length > 0 ? data : [{ hora: '00:00', pedidos: 0, valor: 0 }];
  }, [storeOrders]);
  const pedidosSummary = useMemo(() => {
    const acceptedOrders = storeOrders.filter(isAcceptedOrder);
    return {
      totalRecebidos: storeOrders.length,
      totalFinanceiro: acceptedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      aguardandoAceite: storeOrders.filter((order) => order.status === 'Novo pedido').length,
      cancelados: storeOrders.filter((order) => order.status === 'Cancelado').length,
    };
  }, [storeOrders]);

  const motoboysMap = useMemo(
    () => Object.fromEntries(snapshot.motoboys.map((item) => [String(item.id), item])),
    [snapshot.motoboys],
  );

  const handleAcceptOrder = async (orderId) => {
    try {
      await reserveOrderStock(orderId);
      toast({ title: 'Pedido aceito', description: 'Estoque reservado e pedido enviado para preparação.' });
    } catch (error) {
      toast({ title: 'Falha ao aceitar pedido', description: error.message, variant: 'destructive' });
    }
  };

  const handleAdvanceStatus = async (orderId, nextStatus, successTitle) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      toast({ title: successTitle });
    } catch (error) {
      toast({ title: 'Falha ao atualizar pedido', description: error.message, variant: 'destructive' });
    }
  };

  const handleFinalize = async (orderId) => {
    try {
      await finalizeOrder(orderId);
      toast({ title: 'Pedido finalizado', description: 'Baixa de estoque aplicada automaticamente.' });
    } catch (error) {
      toast({ title: 'Falha ao finalizar pedido', description: error.message, variant: 'destructive' });
    }
  };

  const handlePrintOrder = (order) => {
    const payload = formatOrderForPrint(order);
    printOrder(
      payload.venda,
      payload.itens,
      payload.pagamentos,
      payload.motoboy,
      payload.cliente,
      'FORTIN ERP PRO',
    );
  };

  const handleSaveBairro = async () => {
    if (!bairroDraft.nome || !bairroDraft.taxaEntrega || !bairroDraft.tempoMedio) return;
    setSavingBairro(true);
    try {
      const next = [
        ...bairrosAtivos.filter((item) => item.id !== bairroDraft.id),
        {
          id: bairroDraft.id || bairroDraft.nome.toLowerCase().replace(/\s+/g, '-'),
          nome: bairroDraft.nome,
          taxaEntrega: Number(bairroDraft.taxaEntrega),
          tempoMedio: bairroDraft.tempoMedio,
        },
      ];
      await saveBairrosEntrega(next.sort((a, b) => a.nome.localeCompare(b.nome)));
      setBairroDraft(emptyBairro);
      toast({ title: 'Bairro salvo' });
    } catch (error) {
      toast({ title: 'Falha ao salvar bairro', description: error.message, variant: 'destructive' });
    } finally {
      setSavingBairro(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingConfig(true);
    try {
      await saveAppSettings(appInfoDraft);
      toast({ title: 'Configurações atualizadas' });
    } catch (error) {
      toast({ title: 'Falha ao salvar configurações', description: error.message, variant: 'destructive' });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <ModuleShell title="Painel da Loja" subtitle="Administração da operação de delivery e catálogo.">
      <Helmet>
        <title>Painel da Loja - FORTIN ERP PRO</title>
      </Helmet>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-[#00d084] bg-[#00d084] text-white'
                  : 'border-gray-700 bg-[#1a2332] text-gray-300 hover:border-gray-500'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Pedidos do dia" value={dashboardMetrics.pedidosHoje} />
            <MetricCard
              label="Valor vendido hoje"
              value={deliveryFormatting.formatCurrency(dashboardMetrics.valorHoje)}
              tone="text-[#00d084]"
            />
            <MetricCard label="Em preparação" value={dashboardMetrics.emPreparacao} tone="text-amber-300" />
            <MetricCard label="Entregues" value={dashboardMetrics.entregues} tone="text-emerald-300" />
          </div>

          <PanelCard title="Vendas do dia" subtitle="Leitura em tempo real dos pedidos recebidos pelo aplicativo.">
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="hora" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#00d084" strokeWidth={3} dot={{ fill: '#00d084' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>
        </div>
      ) : null}

      {activeTab === 'pedidos' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-700 bg-[#1a2332] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Pedidos recebidos</div>
              <div className="mt-3 text-3xl font-black text-white">{pedidosSummary.totalRecebidos}</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#1a2332] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Total financeiro</div>
              <div className="mt-3 text-3xl font-black text-[#00d084]">
                {deliveryFormatting.formatCurrency(pedidosSummary.totalFinanceiro)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#1a2332] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Aguardando aceite</div>
              <div className="mt-3 text-3xl font-black text-amber-300">{pedidosSummary.aguardandoAceite}</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#1a2332] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Pedidos cancelados</div>
              <div className="mt-3 text-3xl font-black text-rose-300">{pedidosSummary.cancelados}</div>
            </div>
          </div>

          {storeOrders.length === 0 ? (
            <PanelCard title="Pedidos" subtitle="Os pedidos feitos pelo app do cliente aparecerão aqui automaticamente.">
              <div className="rounded-xl border border-dashed border-gray-700 px-6 py-12 text-center text-gray-400">
                Nenhum pedido recebido ainda.
              </div>
            </PanelCard>
          ) : (
            storeOrders.map((order) => (
              <PanelCard
                key={order.id}
                title={`Pedido #${order.numero}`}
                subtitle={`${order.cliente} • ${order.endereco} • ${deliveryFormatting.formatCurrency(order.total)}`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {order.forma_pagamento === 'Dinheiro' && order.precisaTroco && Number(order.trocoPara || 0) > 0 ? (
                      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                        Troco
                      </span>
                    ) : null}
                    <StatusBadge status={order.status} />
                  </div>
                }
                className={
                  order.forma_pagamento === 'Dinheiro' && order.precisaTroco && Number(order.trocoPara || 0) > 0
                    ? 'border-amber-500/40 shadow-amber-500/10'
                    : ''
                }
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div className="grid gap-2 rounded-xl bg-[#111827] p-4 text-sm text-gray-300 md:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Cliente</div>
                        <div className="mt-1 font-semibold text-white">{order.cliente}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Forma de pagamento</div>
                        <div className="mt-1 font-semibold text-white">{order.forma_pagamento}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Endereço</div>
                        <div className="mt-1 text-white">{order.endereco}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</div>
                        <div className="mt-1 font-semibold text-[#00d084]">{deliveryFormatting.formatCurrency(order.total)}</div>
                      </div>
                    </div>

                    {order.forma_pagamento === 'Dinheiro' ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        <div className="font-semibold text-amber-100">Pagamento em dinheiro</div>
                        <div className="mt-1">
                          {order.precisaTroco && Number(order.trocoPara || 0) > 0
                            ? `Troco para ${deliveryFormatting.formatCurrency(order.trocoPara)}`
                            : 'Cliente informou que não precisa de troco'}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-xl bg-[#111827] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gray-500">Itens</div>
                      <div className="space-y-2">
                        {order.itens.map((item) => (
                          <div
                            key={`${order.id}-${item.id}`}
                            className="flex items-center justify-between rounded-lg bg-[#1f2937] px-3 py-2 text-sm text-gray-200"
                          >
                            <span>
                              {item.quantidade}x {item.produto}
                            </span>
                            <span>{deliveryFormatting.formatCurrency(item.preco_unitario * item.quantidade)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#111827] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gray-500">Estoque</div>
                      {order.stockCheck?.ok ? (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                          Estoque disponível para o pedido.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {order.stockCheck?.missing?.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
                            >
                              {item.produto}: faltam {item.shortBy}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-[#111827] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gray-500">Motoboy</div>
                      <select
                        value={order.motoboyId || ''}
                        onChange={(event) => assignOrderToMotoboy(order.id, motoboysMap[event.target.value] || null)}
                        className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-3 py-2 text-sm text-white outline-none focus:border-[#00d084]"
                      >
                        <option value="">Sem vínculo</option>
                        {snapshot.motoboys.map((motoboy) => (
                          <option key={motoboy.id} value={motoboy.id}>
                            {motoboy.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={order.status !== 'Novo pedido'}
                        className={
                          order.status === 'Novo pedido'
                            ? 'bg-[#00d084] text-white hover:bg-[#00b872]'
                            : 'bg-[#2d3e52] text-gray-300 hover:bg-[#2d3e52]'
                        }
                      >
                        Aceitar pedido
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Em preparação', 'Pedido em preparação')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-[#2d3e52] text-white hover:bg-[#36495f]"
                      >
                        Preparar
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Saiu para entrega', 'Pedido saiu para entrega')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-[#2d3e52] text-white hover:bg-[#36495f]"
                      >
                        Enviar para entrega
                      </Button>
                      <Button
                        onClick={() => handleFinalize(order.id)}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-blue-600 text-white hover:bg-blue-500 disabled:bg-[#2d3e52] disabled:text-gray-300"
                      >
                        Finalizar
                      </Button>
                      <Button
                        onClick={() => handlePrintOrder(order)}
                        variant="outline"
                        className="border-gray-600 bg-transparent text-gray-200 hover:bg-gray-800"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir pedido
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Cancelado', 'Pedido cancelado')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        variant="outline"
                        className="border-rose-500/40 bg-transparent text-rose-300 hover:bg-rose-500/10 disabled:border-gray-600 disabled:text-gray-400"
                      >
                        Cancelar pedido
                      </Button>
                    </div>
                  </div>
                </div>
              </PanelCard>
            ))
          )}
        </div>
      ) : null}

      {activeTab === 'produtos' ? (
        <PanelCard title="Produtos do App" subtitle="Publique produtos já cadastrados no ERP para o aplicativo de pedidos.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-700 text-left text-xs uppercase tracking-[0.2em] text-gray-500">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Disponível no App</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-800 text-sm text-gray-200">
                    <td className="px-4 py-3">{product.descricao}</td>
                    <td className="px-4 py-3">{deliveryFormatting.formatCurrency(product.valor_venda)}</td>
                    <td className="px-4 py-3">{product.categoria || 'Sem categoria'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublishedProduct(product.id)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          publishedIds.includes(product.id) ? 'bg-[#00d084] text-white' : 'bg-[#2d3e52] text-gray-300'
                        }`}
                      >
                        {publishedIds.includes(product.id) ? 'Sim' : 'Não'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      ) : null}

      {activeTab === 'clientes' ? (
        <PanelCard title="Clientes" subtitle="Clientes vindos do aplicativo e sincronizados com o cadastro do ERP.">
          <div className="grid gap-3 lg:grid-cols-2">
            {clientsRows.map((client) => (
              <div key={client.id} className="rounded-xl border border-gray-700 bg-[#111827] p-4">
                <div className="text-lg font-semibold text-white">{client.nome}</div>
                <div className="mt-3 space-y-1 text-sm text-gray-300">
                  <div>Telefone: {client.telefone}</div>
                  <div>Endereço: {client.endereco}</div>
                  <div>Bairro: {client.bairro}</div>
                  <div>Total de pedidos: {client.totalPedidos}</div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      ) : null}

      {activeTab === 'motoboys' ? (
        <PanelCard title="Motoboys" subtitle="Motoboys cadastrados e disponíveis para vincular pedidos.">
          <div className="grid gap-3 lg:grid-cols-2">
            {snapshot.motoboys.map((motoboy) => (
              <div key={motoboy.id} className="rounded-xl border border-gray-700 bg-[#111827] p-4">
                <div className="text-lg font-semibold text-white">{motoboy.nome}</div>
                <div className="mt-2 text-sm text-gray-300">{motoboy.telefone || 'Sem telefone'}</div>
              </div>
            ))}
          </div>
        </PanelCard>
      ) : null}

      {activeTab === 'bairros' ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <PanelCard title="Novo bairro" subtitle="Configure taxa e tempo médio de entrega.">
            <div className="space-y-3">
              <input
                value={bairroDraft.nome}
                onChange={(event) => setBairroDraft((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Nome do bairro"
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
              <input
                value={bairroDraft.taxaEntrega}
                onChange={(event) => setBairroDraft((current) => ({ ...current, taxaEntrega: event.target.value }))}
                placeholder="Taxa de entrega"
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
              <input
                value={bairroDraft.tempoMedio}
                onChange={(event) => setBairroDraft((current) => ({ ...current, tempoMedio: event.target.value }))}
                placeholder="Tempo médio"
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
              <Button onClick={handleSaveBairro} className="w-full bg-[#00d084] text-white hover:bg-[#00b872]">
                {savingBairro ? 'Salvando...' : 'Salvar bairro'}
              </Button>
            </div>
          </PanelCard>

          <PanelCard title="Bairros atendidos" subtitle="Nome do bairro, taxa de entrega e tempo médio.">
            <div className="space-y-3">
              {bairrosAtivos.map((bairro) => (
                <div key={bairro.id} className="flex items-center justify-between rounded-xl border border-gray-700 bg-[#111827] px-4 py-3">
                  <div>
                    <div className="font-semibold text-white">{bairro.nome}</div>
                    <div className="text-sm text-gray-400">
                      Taxa: {deliveryFormatting.formatCurrency(bairro.taxaEntrega)} • Tempo: {bairro.tempoMedio}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setBairroDraft({ ...bairro, taxaEntrega: String(bairro.taxaEntrega) })}
                    className="border-gray-600 bg-transparent text-gray-200 hover:bg-gray-800"
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      ) : null}

      {activeTab === 'configuracoes' ? (
        <PanelCard title="Configurações" subtitle="Fonte dos produtos, destino dos pedidos e cadastro de clientes.">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Fonte dos produtos</label>
              <input
                value={appInfoDraft.sourceProdutos || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, sourceProdutos: event.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Destino dos pedidos</label>
              <input
                value={appInfoDraft.destinoPedidos || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, destinoPedidos: event.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Cadastro de clientes</label>
              <input
                value={appInfoDraft.cadastroClientes || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, cadastroClientes: event.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#0f1419] px-4 py-3 text-white outline-none focus:border-[#00d084]"
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} className="mt-4 bg-[#00d084] text-white hover:bg-[#00b872]">
            <Save className="mr-2 h-4 w-4" />
            {savingConfig ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </PanelCard>
      ) : null}
    </ModuleShell>
  );
};

export default PainelLojaPage;
