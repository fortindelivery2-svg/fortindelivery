import React from 'react';
import { Helmet } from 'react-helmet';
import { ExternalLink, FolderSync, Package, ShoppingBag, Store, Users } from 'lucide-react';
import ModuleShell from '@/components/delivery/ModuleShell';
import MetricCard from '@/components/delivery/MetricCard';
import PanelCard from '@/components/delivery/PanelCard';
import { Button } from '@/components/ui/button';
import { useDeliveryHub } from '@/hooks/useDeliveryHub';

const AppPedidosPage = () => {
  const { user, snapshot, summaries } = useDeliveryHub();

  const handleOpenExternalApp = () => {
    const storeId = encodeURIComponent(user?.id || '');
    window.open(`/app/pedidos-cliente?store=${storeId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <ModuleShell title="App de Pedidos" subtitle="Aplicativo externo para o cliente fazer pedidos e enviar para a loja.">
      <Helmet>
        <title>App de Pedidos - FORTIN ERP PRO</title>
      </Helmet>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Produtos publicados" value={summaries.metrics.produtosPublicados} />
        <MetricCard label="Clientes cadastrados" value={summaries.metrics.clientesCadastrados} />
        <MetricCard label="Bairros atendidos" value={summaries.metrics.bairrosAtendidos} />
        <MetricCard label="Pedidos recebidos" value={summaries.metrics.pedidosRecebidos} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <PanelCard title="Acesso ao aplicativo externo" subtitle="Página do app do cliente">
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
            <div className="flex items-center gap-3 text-white">
              <Store className="h-6 w-6 text-[#00d084]" />
              <div>
                <div className="font-semibold">Página do app do cliente</div>
                <div className="text-sm text-gray-400">Usa produtos, clientes e estoque do ERP em tempo real.</div>
              </div>
            </div>
            <Button onClick={handleOpenExternalApp} className="mt-5 bg-[#00d084] text-white hover:bg-[#00b872]">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir aplicativo do cliente
            </Button>
          </div>
        </PanelCard>

        <PanelCard title="Fontes de dados" subtitle="Integração entre os sistemas">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-gray-200">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#00d084]" />
                Fonte dos produtos
              </span>
              <span className="font-semibold">{snapshot.settings?.appInfo?.sourceProdutos || 'produtos_erp'}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-gray-200">
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#00d084]" />
                Destino dos pedidos
              </span>
              <span className="font-semibold">{snapshot.settings?.appInfo?.destinoPedidos || 'pedidos_delivery'}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#111827] px-4 py-3 text-gray-200">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00d084]" />
                Cadastro de clientes
              </span>
              <span className="font-semibold">{snapshot.settings?.appInfo?.cadastroClientes || 'clientes'}</span>
            </div>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Fluxo completo" subtitle="Como os pedidos trafegam entre o app e a operação da loja." className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            'Cliente faz pedido no APP',
            'Pedido aparece automaticamente no Painel da Loja → Pedidos',
            'Loja pode aceitar, imprimir, enviar para motoboy e finalizar',
            'Finalização atualiza estoque automaticamente',
          ].map((step, index) => (
            <div key={step} className="rounded-xl border border-gray-700 bg-[#111827] p-4 text-sm text-gray-200">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#00d084] font-bold text-white">
                {index + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Resumo operacional" subtitle="Catálogo publicado e pedidos integrados ao hub." className="mt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4 text-gray-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-white">
              <FolderSync className="h-4 w-4 text-[#00d084]" />
              Produtos do ERP
            </div>
            <div>{snapshot.publishedProducts.length} publicados no app</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4 text-gray-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Users className="h-4 w-4 text-[#00d084]" />
              Clientes
            </div>
            <div>{snapshot.people.length} sincronizados com o ERP</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4 text-gray-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-white">
              <ShoppingBag className="h-4 w-4 text-[#00d084]" />
              Pedidos
            </div>
            <div>{snapshot.orders.length} recebidos pelo hub delivery</div>
          </div>
        </div>
      </PanelCard>
    </ModuleShell>
  );
};

export default AppPedidosPage;
