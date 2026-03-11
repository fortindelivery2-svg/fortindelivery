import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import {
  Bike,
  ChartNoAxesCombined,
  Loader2,
  Package,
  Palette,
  Printer,
  Save,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ModuleShell from '@/features/delivery/components/ModuleShell';
import MetricCard from '@/features/delivery/components/MetricCard';
import PanelCard from '@/features/delivery/components/PanelCard';
import StatusBadge from '@/features/delivery/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDeliveryHub } from '@/features/delivery/hooks/useDeliveryHub';
import { supabase } from '@/lib/customSupabaseClient';
import { deliveryFormatting, formatOrderForPrint } from '@/features/delivery/services/deliveryHubService';
import { printDeliveryDashboardReport } from '@/utils/printDeliveryDashboardReport';
import { printOrder } from '@/utils/printOrder';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { key: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { key: 'produtos', label: 'Produtos', icon: Package },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'motoboys', label: 'Motoboys', icon: Bike },
  { key: 'bairros', label: 'Bairros de entrega', icon: Store },
  { key: 'configuracoes', label: 'Configurações', icon: Settings },
  { key: 'personalizacao', label: 'Personalização do App', icon: Palette },
];

const emptyBairro = { id: '', nome: '', taxaEntrega: '', tempoMedio: '' };
const AUTO_PRINT_KEY = 'deliveryAutoPrintEnabled';
const AUTO_PRINT_LAST_KEY = 'deliveryAutoPrintLastAt';

const getLocalDateKey = (dateValue) => {
  const date = new Date(dateValue || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const isAcceptedOrder = (order) => !['Novo pedido', 'Cancelado'].includes(order.status);

const PainelLojaPage = () => {
  const location = useLocation();
  const { toast } = useToast();
  const {
    user,
    snapshot,
    summaries,
    togglePausedProduct,
    togglePublishedProduct,
    saveBairrosEntrega,
    saveAppSettings,
    loadSnapshot,
    reserveOrderStock,
    updateOrderStatus,
    assignOrderToMotoboy,
    finalizeOrder,
  } = useDeliveryHub();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [bairroDraft, setBairroDraft] = useState(emptyBairro);
  const [savingBairro, setSavingBairro] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState('');
  const [categoryDrafts, setCategoryDrafts] = useState({});
  const [appInfoDraft, setAppInfoDraft] = useState(snapshot.settings?.appInfo || {});
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(
    () => window.localStorage.getItem(AUTO_PRINT_KEY) === '1',
  );
  const lastPrintedAtRef = useRef(Number(window.localStorage.getItem(AUTO_PRINT_LAST_KEY) || 0));

  useEffect(() => {
    setAppInfoDraft(snapshot.settings?.appInfo || {});
  }, [snapshot.settings]);

  useEffect(() => {
    setCategoryDrafts(
      Object.fromEntries(
        snapshot.products.map((product) => [product.id, product.categoria || '']),
      ),
    );
  }, [snapshot.products]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab');
    if (requestedTab && tabs.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search]);

  const clientsRows = summaries.clientesApp;
  const bairrosAtivos = snapshot.settings?.bairros || [];
  const publishedIds = snapshot.settings?.publishedProductIds || [];
  const pausedIds = snapshot.settings?.pausedProductIds || [];
  const storeOrders = useMemo(
    () => snapshot.orders.filter((order) => order.origem === 'app'),
    [snapshot.orders],
  );

  useEffect(() => {
    window.localStorage.setItem(AUTO_PRINT_KEY, autoPrintEnabled ? '1' : '0');
    if (!autoPrintEnabled) return;

    if (!lastPrintedAtRef.current) {
      const latestTimestamp = storeOrders.reduce((max, order) => {
        const createdAt = Number(new Date(order.createdAt || 0));
        return createdAt > max ? createdAt : max;
      }, 0);
      lastPrintedAtRef.current = latestTimestamp;
      window.localStorage.setItem(AUTO_PRINT_LAST_KEY, String(latestTimestamp));
    }
  }, [autoPrintEnabled, storeOrders]);

  const dashboardMetrics = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const ordersToday = storeOrders.filter((order) => getLocalDateKey(order.createdAt) === today);
    const financialOrdersToday = ordersToday.filter((order) => order.status !== 'Cancelado');

    return {
      pedidosHoje: ordersToday.length,
      valorHoje: financialOrdersToday.reduce((sum, order) => sum + Number(order.total || 0), 0),
      emPreparacao: storeOrders.filter((order) =>
        String(order.status || '').toLowerCase().includes('prepara'),
      ).length,
      entregues: storeOrders.filter((order) => order.status === 'Entregue').length,
      canceladosHoje: ordersToday.filter((order) => order.status === 'Cancelado').length,
      ticketMedioHoje:
        financialOrdersToday.length > 0
          ? financialOrdersToday.reduce((sum, order) => sum + Number(order.total || 0), 0) / financialOrdersToday.length
          : 0,
    };
  }, [storeOrders]);

  const dailyPaymentSummary = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const financialOrdersToday = storeOrders.filter(
      (order) => getLocalDateKey(order.createdAt) === today && order.status !== 'Cancelado',
    );

    const summary = {
      Dinheiro: { count: 0, total: 0 },
      Cartão: { count: 0, total: 0 },
      PIX: { count: 0, total: 0 },
      Outros: { count: 0, total: 0 },
    };

    financialOrdersToday.forEach((order) => {
      const method = String(order.forma_pagamento || '').toLowerCase();
      const key = method.includes('dinheiro')
        ? 'Dinheiro'
        : method.includes('cart')
          ? 'Cartão'
          : method.includes('pix')
            ? 'PIX'
            : 'Outros';

      summary[key].count += 1;
      summary[key].total += Number(order.total || 0);
    });

    return summary;
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

  const dailyReportData = useMemo(() => {
    const today = getLocalDateKey(new Date());
    const ordersToday = storeOrders.filter((order) => getLocalDateKey(order.createdAt) === today);
    const financialOrdersToday = ordersToday.filter((order) => order.status !== 'Cancelado');
    const totalFinanceiro = financialOrdersToday.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const taxaEntregaTotal = financialOrdersToday.reduce((sum, order) => sum + Number(order.taxaEntrega || 0), 0);

    return {
      totalPedidos: ordersToday.length,
      cancelados: ordersToday.filter((order) => order.status === 'Cancelado').length,
      entregues: ordersToday.filter((order) => order.status === 'Entregue').length,
      pedidosFinanceiros: financialOrdersToday.length,
      totalFinanceiro,
      taxaEntregaTotal,
      ticketMedio: financialOrdersToday.length > 0 ? totalFinanceiro / financialOrdersToday.length : 0,
      paymentSummary: dailyPaymentSummary,
      orders: ordersToday,
    };
  }, [dailyPaymentSummary, storeOrders]);

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

  useEffect(() => {
    if (!autoPrintEnabled) return;

    const lastPrintedAt = lastPrintedAtRef.current || 0;
    const toPrint = storeOrders
      .filter((order) => order.status === 'Novo pedido')
      .filter((order) => {
        const createdAt = Number(new Date(order.createdAt || 0));
        return createdAt > lastPrintedAt;
      })
      .sort((a, b) => Number(new Date(a.createdAt || 0)) - Number(new Date(b.createdAt || 0)));

    if (toPrint.length === 0) return;

    toPrint.forEach((order) => handlePrintOrder(order));

    const latestTimestamp = toPrint.reduce((max, order) => {
      const createdAt = Number(new Date(order.createdAt || 0));
      return createdAt > max ? createdAt : max;
    }, lastPrintedAt);

    lastPrintedAtRef.current = latestTimestamp;
    window.localStorage.setItem(AUTO_PRINT_LAST_KEY, String(latestTimestamp));
  }, [autoPrintEnabled, storeOrders]);

  const handlePrintDashboardReport = () => {
    printDeliveryDashboardReport(dailyReportData);
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

  const handleSaveCategory = async (productId) => {
    if (!user?.id) return;

    setSavingCategoryId(productId);
    try {
      const categoria = (categoryDrafts[productId] || '').trim();
      const { error } = await supabase
        .from('produtos')
        .update({ categoria: categoria || null })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadSnapshot();
      toast({ title: 'Categoria atualizada' });
    } catch (error) {
      toast({ title: 'Falha ao salvar categoria', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCategoryId('');
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAppInfoDraft((current) => ({
        ...current,
        logoUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const toggleAutoPrint = () => {
    setAutoPrintEnabled((current) => {
      const next = !current;
      toast({
        title: `Impressão automática ${next ? 'ativada' : 'desativada'}`,
        description: next
          ? 'Novos pedidos do app serão impressos assim que chegarem.'
          : 'Os pedidos continuarão aparecendo no painel, mas sem impressão automática.',
      });
      return next;
    });
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
                  ? 'border-[var(--layout-accent)] bg-[var(--layout-accent)] text-white'
                  : 'border-[var(--layout-border)] bg-[var(--layout-bg)] text-[var(--layout-text-muted)] hover:border-gray-500'
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
              tone="text-[var(--layout-accent)]"
            />
            <MetricCard label="Em preparação" value={dashboardMetrics.emPreparacao} tone="text-amber-300" />
            <MetricCard label="Entregues" value={dashboardMetrics.entregues} tone="text-emerald-300" />
          </div>

          <PanelCard
            title="Vendas do dia"
            subtitle="Leitura em tempo real dos pedidos recebidos pelo aplicativo."
            actions={
              <Button onClick={handlePrintDashboardReport} className="bg-blue-600 text-white hover:bg-blue-500">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir relatÃ³rio
              </Button>
            }
          >
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
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="var(--layout-accent)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--layout-accent)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>

          <PanelCard title="Resumo diÃ¡rio de vendas" subtitle="Pedidos do app por forma de pagamento, em valores reais e sem considerar cancelados.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(dailyPaymentSummary).map(([method, summary]) => (
                <div key={method} className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">{method}</div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {deliveryFormatting.formatCurrency(summary.total)}
                  </div>
                  <div className="mt-1 text-sm text-[var(--layout-text-muted)]">{summary.count} pedido(s)</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Cancelados hoje</div>
                <div className="mt-2 text-2xl font-black text-rose-300">{dashboardMetrics.canceladosHoje}</div>
              </div>
              <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Ticket mÃ©dio</div>
                <div className="mt-2 text-2xl font-black text-[var(--layout-accent)]">
                  {deliveryFormatting.formatCurrency(dashboardMetrics.ticketMedioHoje)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Taxa de entrega</div>
                <div className="mt-2 text-2xl font-black text-sky-300">
                  {deliveryFormatting.formatCurrency(dailyReportData.taxaEntregaTotal)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Saldo financeiro do dia</div>
                <div className="mt-2 text-2xl font-black text-white">
                  {deliveryFormatting.formatCurrency(dashboardMetrics.valorHoje)}
                </div>
              </div>
            </div>
          </PanelCard>
        </div>
      ) : null}

      {activeTab === 'pedidos' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-white">Impressão automática</div>
              <div className="text-xs text-[var(--layout-text-muted)]">
                Imprime novos pedidos recebidos pelo aplicativo assim que chegam.
              </div>
            </div>
            <Button
              onClick={toggleAutoPrint}
              className={
                autoPrintEnabled
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-[var(--layout-surface-2)] text-gray-200 hover:bg-[var(--layout-border)]'
              }
            >
              <Printer className="mr-2 h-4 w-4" />
              {autoPrintEnabled ? 'Ligado' : 'Desligado'}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Pedidos recebidos</div>
              <div className="mt-3 text-3xl font-black text-white">{pedidosSummary.totalRecebidos}</div>
            </div>
            <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Total financeiro</div>
              <div className="mt-3 text-3xl font-black text-[var(--layout-accent)]">
                {deliveryFormatting.formatCurrency(pedidosSummary.totalFinanceiro)}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Aguardando aceite</div>
              <div className="mt-3 text-3xl font-black text-amber-300">{pedidosSummary.aguardandoAceite}</div>
            </div>
            <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Pedidos cancelados</div>
              <div className="mt-3 text-3xl font-black text-rose-300">{pedidosSummary.cancelados}</div>
            </div>
          </div>

          {storeOrders.length === 0 ? (
            <PanelCard title="Pedidos" subtitle="Os pedidos feitos pelo app do cliente aparecerão aqui automaticamente.">
              <div className="rounded-xl border border-dashed border-[var(--layout-border)] px-6 py-12 text-center text-[var(--layout-text-muted)]">
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
                    <div className="grid gap-2 rounded-xl bg-[var(--layout-surface-2)] p-4 text-sm text-[var(--layout-text-muted)] md:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Cliente</div>
                        <div className="mt-1 font-semibold text-white">{order.cliente}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Forma de pagamento</div>
                        <div className="mt-1 font-semibold text-white">{order.forma_pagamento}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Endereço</div>
                        <div className="mt-1 text-white">{order.endereco}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Total</div>
                        <div className="mt-1 font-semibold text-[var(--layout-accent)]">{deliveryFormatting.formatCurrency(order.total)}</div>
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

                    <div className="rounded-xl bg-[var(--layout-surface-2)] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Itens</div>
                      <div className="space-y-2">
                        {order.itens.map((item) => (
                          <div
                            key={`${order.id}-${item.id}`}
                            className="flex items-center justify-between rounded-lg bg-[var(--layout-surface-2)] px-3 py-2 text-sm text-gray-200"
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
                    <div className="rounded-xl bg-[var(--layout-surface-2)] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Estoque</div>
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

                    <div className="rounded-xl bg-[var(--layout-surface-2)] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">Motoboy</div>
                      <select
                        value={order.motoboyId || ''}
                        onChange={(event) => assignOrderToMotoboy(order.id, motoboysMap[event.target.value] || null)}
                        className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--layout-accent)]"
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
                            ? 'bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]'
                            : 'bg-[var(--layout-surface-2)] text-[var(--layout-text-muted)] hover:bg-[var(--layout-surface-2)]'
                        }
                      >
                        Aceitar pedido
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Em preparação', 'Pedido em preparação')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-[var(--layout-surface-2)] text-white hover:bg-[var(--layout-border)]"
                      >
                        Preparar
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Saiu para entrega', 'Pedido saiu para entrega')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-[var(--layout-surface-2)] text-white hover:bg-[var(--layout-border)]"
                      >
                        Enviar para entrega
                      </Button>
                      <Button
                        onClick={() => handleFinalize(order.id)}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        className="bg-blue-600 text-white hover:bg-blue-500 disabled:bg-[var(--layout-surface-2)] disabled:text-[var(--layout-text-muted)]"
                      >
                        Finalizar
                      </Button>
                      <Button
                        onClick={() => handlePrintOrder(order)}
                        variant="outline"
                        className="border-[var(--layout-border)] bg-transparent text-gray-200 hover:bg-gray-800"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir pedido
                      </Button>
                      <Button
                        onClick={() => handleAdvanceStatus(order.id, 'Cancelado', 'Pedido cancelado')}
                        disabled={order.status === 'Cancelado' || order.status === 'Entregue'}
                        variant="outline"
                        className="border-rose-500/40 bg-transparent text-rose-300 hover:bg-rose-500/10 disabled:border-[var(--layout-border)] disabled:text-[var(--layout-text-muted)]"
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
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="border-b border-[var(--layout-border)] text-left text-xs uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Status no App</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.products.map((product) => {
                  const isPublished =
                    (snapshot.settings?.publishAllProducts ?? true) && publishedIds.length === 0
                      ? true
                      : publishedIds.includes(product.id);
                  const isPaused = isPublished && pausedIds.includes(product.id);

                  return (
                    <tr key={product.id} className="border-b border-gray-800 text-sm text-gray-200">
                      <td className="px-4 py-3">{product.descricao}</td>
                      <td className="px-4 py-3">{deliveryFormatting.formatCurrency(product.valor_venda)}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[220px] items-center gap-2">
                          <input
                            value={categoryDrafts[product.id] ?? product.categoria ?? ''}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [product.id]: event.target.value,
                              }))
                            }
                            placeholder="Categoria"
                            className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--layout-accent)]"
                          />
                          <button
                            onClick={() => handleSaveCategory(product.id)}
                            disabled={savingCategoryId === product.id}
                            className="inline-flex h-9 min-w-[84px] items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-[var(--layout-surface-2)]"
                          >
                            {savingCategoryId === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Salvar'
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            !isPublished
                              ? 'bg-[var(--layout-surface-2)] text-[var(--layout-text-muted)]'
                              : isPaused
                                ? 'bg-amber-500/20 text-amber-200'
                                : 'bg-[var(--layout-accent)] text-white'
                          }`}
                        >
                          {!isPublished ? 'Não publicado' : isPaused ? 'Pausado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => togglePublishedProduct(product.id)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isPublished ? 'bg-rose-500/15 text-rose-200' : 'bg-[var(--layout-accent)] text-white'
                            }`}
                          >
                            {isPublished ? 'Remover do app' : 'Publicar no app'}
                          </button>
                          <button
                            onClick={() => togglePausedProduct(product.id)}
                            disabled={!isPublished}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              !isPublished
                                ? 'cursor-not-allowed bg-[var(--layout-surface-2)] text-[var(--layout-text-muted)]'
                                : isPaused
                                  ? 'bg-blue-500/15 text-blue-200'
                                  : 'bg-amber-500/15 text-amber-200'
                            }`}
                          >
                            {isPaused ? 'Retomar produto' : 'Pausar produto'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PanelCard>
      ) : null}

      {activeTab === 'clientes' ? (
        <PanelCard title="Clientes" subtitle="Clientes vindos do aplicativo e sincronizados com o cadastro do ERP.">
          <div className="grid gap-3 lg:grid-cols-2">
            {clientsRows.map((client) => (
              <div key={client.id} className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-lg font-semibold text-white">{client.nome}</div>
                <div className="mt-3 space-y-1 text-sm text-[var(--layout-text-muted)]">
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
              <div key={motoboy.id} className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="text-lg font-semibold text-white">{motoboy.nome}</div>
                <div className="mt-2 text-sm text-[var(--layout-text-muted)]">{motoboy.telefone || 'Sem telefone'}</div>
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
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
              <input
                value={bairroDraft.taxaEntrega}
                onChange={(event) => setBairroDraft((current) => ({ ...current, taxaEntrega: event.target.value }))}
                placeholder="Taxa de entrega"
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
              <input
                value={bairroDraft.tempoMedio}
                onChange={(event) => setBairroDraft((current) => ({ ...current, tempoMedio: event.target.value }))}
                placeholder="Tempo médio"
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
              <Button onClick={handleSaveBairro} className="w-full bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]">
                {savingBairro ? 'Salvando...' : 'Salvar bairro'}
              </Button>
            </div>
          </PanelCard>

          <PanelCard title="Bairros atendidos" subtitle="Nome do bairro, taxa de entrega e tempo médio.">
            <div className="space-y-3">
              {bairrosAtivos.map((bairro) => (
                <div key={bairro.id} className="flex items-center justify-between rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] px-4 py-3">
                  <div>
                    <div className="font-semibold text-white">{bairro.nome}</div>
                    <div className="text-sm text-[var(--layout-text-muted)]">
                      Taxa: {deliveryFormatting.formatCurrency(bairro.taxaEntrega)} • Tempo: {bairro.tempoMedio}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setBairroDraft({ ...bairro, taxaEntrega: String(bairro.taxaEntrega) })}
                    className="border-[var(--layout-border)] bg-transparent text-gray-200 hover:bg-gray-800"
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
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Fonte dos produtos</label>
              <input
                value={appInfoDraft.sourceProdutos || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, sourceProdutos: event.target.value }))}
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Destino dos pedidos</label>
              <input
                value={appInfoDraft.destinoPedidos || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, destinoPedidos: event.target.value }))}
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Cadastro de clientes</label>
              <input
                value={appInfoDraft.cadastroClientes || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, cadastroClientes: event.target.value }))}
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} className="mt-4 bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]">
            <Save className="mr-2 h-4 w-4" />
            {savingConfig ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </PanelCard>
      ) : null}

      {activeTab === 'personalizacao' ? (
        <PanelCard title="Personalização do App" subtitle="Nome, logo, cores, horário e endereço exibidos no aplicativo de clientes.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Nome do aplicativo</label>
              <input
                value={appInfoDraft.nomeAplicativo || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, nomeAplicativo: event.target.value }))}
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Horário de funcionamento</label>
              <input
                value={appInfoDraft.horarioFuncionamento || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, horarioFuncionamento: event.target.value }))}
                placeholder="Ex: Seg a Dom • 08:00 às 22:00"
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Endereço da loja física</label>
              <input
                value={appInfoDraft.enderecoLoja || ''}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, enderecoLoja: event.target.value }))}
                placeholder="Ex: Av. Brasil, 1000 - Centro"
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-white outline-none focus:border-[var(--layout-accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Cor principal</label>
              <input
                type="color"
                value={appInfoDraft.corPrimaria || '#ff4d42'}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, corPrimaria: event.target.value }))}
                className="h-12 w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] p-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Cor secundária</label>
              <input
                type="color"
                value={appInfoDraft.corSecundaria || '#4b2e1f'}
                onChange={(event) => setAppInfoDraft((current) => ({ ...current, corSecundaria: event.target.value }))}
                className="h-12 w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-[var(--layout-text-muted)]">Logo do aplicativo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-sm text-[var(--layout-text-muted)] outline-none file:mr-4 file:rounded-md file:border-0 file:bg-[var(--layout-accent)] file:px-3 file:py-2 file:text-white"
              />
            </div>
            {appInfoDraft.logoUrl ? (
              <div className="md:col-span-2 rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
                <div className="mb-3 text-sm font-semibold text-white">Pré-visualização da logo</div>
                <div className="flex items-center justify-between gap-4">
                  <img src={appInfoDraft.logoUrl} alt="Logo do aplicativo" className="h-16 w-16 rounded-2xl object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAppInfoDraft((current) => ({ ...current, logoUrl: '' }))}
                    className="border-[var(--layout-border)] bg-transparent text-gray-200 hover:bg-gray-800"
                  >
                    Remover logo
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <Button onClick={handleSaveSettings} className="mt-4 bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]">
            <Save className="mr-2 h-4 w-4" />
            {savingConfig ? 'Salvando...' : 'Salvar personalização'}
          </Button>
        </PanelCard>
      ) : null}
    </ModuleShell>
  );
};

export default PainelLojaPage;

