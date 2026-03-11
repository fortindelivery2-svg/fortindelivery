import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Bot, List, PackageSearch, Shapes, ShoppingBag, TerminalSquare } from 'lucide-react';
import ModuleShell from '@/components/delivery/ModuleShell';
import PanelCard from '@/components/delivery/PanelCard';
import { Button } from '@/components/ui/button';
import { useDeliveryHub } from '@/hooks/useDeliveryHub';

const exampleCode = `window.chatbotApi.getProdutos()

window.chatbotApi.buscarProduto("coca cola")

window.chatbotApi.getProdutoPorId("123")

window.chatbotApi.criarPedido({
  cliente: "João",
  itens: [
    { id: "123", produto: "Coca Cola", quantidade: 2, preco_unitario: 4.5 }
  ],
  forma_pagamento: "PIX",
  valor_total: 9,
  endereco: "Rua Exemplo 123",
  bairro: "Centro",
  data: new Date().toISOString()
})`;

const ChatbotApiPage = () => {
  const { chatbotApi, chatbotDefaultResponse, snapshot } = useDeliveryHub();
  const [response, setResponse] = useState(chatbotDefaultResponse);
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    if (!chatbotApi) return undefined;
    window.chatbotApi = chatbotApi;
    return () => {
      delete window.chatbotApi;
    };
  }, [chatbotApi]);

  const runAction = async (name, handler) => {
    try {
      setLoadingAction(name);
      const result = await handler();
      setResponse(result);
    } catch (error) {
      setResponse({
        status: 'error',
        message: error.message || 'Falha ao executar ação.',
      });
    } finally {
      setLoadingAction('');
    }
  };

  const sampleProduct = snapshot.products.find((item) =>
    item.descricao.toLowerCase().includes('coca cola'),
  );

  const quickActions = [
    {
      key: 'produtos',
      label: 'Listar produtos',
      icon: List,
      action: () => chatbotApi.getProdutos(),
    },
    {
      key: 'buscar-coca',
      label: 'Buscar Coca Cola',
      icon: PackageSearch,
      action: () => chatbotApi.buscarProduto('coca cola'),
    },
    {
      key: 'categorias',
      label: 'Listar categorias',
      icon: Shapes,
      action: () => chatbotApi.getCategorias(),
    },
    {
      key: 'pedidos',
      label: 'Listar pedidos',
      icon: ShoppingBag,
      action: () => chatbotApi.getPedidos(),
    },
    {
      key: 'pedido-teste',
      label: 'Criar pedido teste',
      icon: Bot,
      action: () =>
        chatbotApi.criarPedido({
          cliente: 'João',
          telefone: '(31) 99999-0000',
          itens: [
            {
              id: sampleProduct?.id || snapshot.products[0]?.id || '123',
              produto: sampleProduct?.descricao || snapshot.products[0]?.descricao || 'Coca Cola',
              quantidade: 2,
              preco_unitario: Number(sampleProduct?.valor_venda || snapshot.products[0]?.valor_venda || 4.5),
            },
          ],
          forma_pagamento: 'PIX',
          valor_total: Number(sampleProduct?.valor_venda || snapshot.products[0]?.valor_venda || 4.5) * 2,
          endereco: 'Rua Exemplo 123',
          bairro: 'Centro',
          data: new Date().toISOString(),
        }),
    },
  ];

  return (
    <ModuleShell
      title="Chatbot API"
      subtitle="Teste os endpoints simulados para integração com chatbot"
    >
      <Helmet>
        <title>Chatbot API - FORTIN ERP PRO</title>
      </Helmet>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard
          title="Ações rápidas"
          subtitle="Simule integrações com WhatsApp, Telegram ou bot próprio usando os dados atuais do ERP."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  onClick={() => runAction(item.key, item.action)}
                  className="justify-start bg-[var(--layout-surface-2)] py-6 text-left text-white hover:bg-[var(--layout-border)]"
                >
                  <Icon className="mr-2 h-4 w-4 text-[var(--layout-accent)]" />
                  {loadingAction === item.key ? 'Executando...' : item.label}
                </Button>
              );
            })}
          </div>
        </PanelCard>

        <PanelCard
          title="Fontes conectadas"
          subtitle="A API simulada lê dados do ERP e do hub de pedidos delivery."
        >
          <div className="space-y-3 text-sm text-[var(--layout-text-muted)]">
            <div className="flex items-center justify-between rounded-lg bg-[var(--layout-surface-2)] px-4 py-3">
              <span>Produtos</span>
              <span>{snapshot.products.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--layout-surface-2)] px-4 py-3">
              <span>Categorias</span>
              <span>{snapshot.categories.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--layout-surface-2)] px-4 py-3">
              <span>Pedidos</span>
              <span>{snapshot.orders.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--layout-surface-2)] px-4 py-3">
              <span>Clientes</span>
              <span>{snapshot.people.length}</span>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard
          title="Resposta JSON"
          subtitle="Retorno atual do endpoint simulado"
          className="min-h-[420px]"
        >
          <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
            <pre className="overflow-auto whitespace-pre-wrap break-all font-mono text-sm leading-6 text-[#7dd3fc]">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </PanelCard>

        <PanelCard
          title="Exemplos de uso"
          subtitle="Métodos disponíveis em window.chatbotApi"
          actions={
            <div className="rounded-lg border border-[var(--layout-accent)]/30 bg-[var(--layout-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--layout-accent)]">
              window.chatbotApi ativo
            </div>
          }
        >
          <div className="rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--layout-text-muted)]">
              <TerminalSquare className="h-4 w-4 text-[var(--layout-accent)]" />
              Console / integração externa
            </div>
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-sm leading-6 text-gray-200">
              {exampleCode}
            </pre>
          </div>
        </PanelCard>
      </div>
    </ModuleShell>
  );
};

export default ChatbotApiPage;

