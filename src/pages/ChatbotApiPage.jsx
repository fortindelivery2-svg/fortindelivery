import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Bot,
  Clock,
  List,
  MapPin,
  MessageSquare,
  PackageSearch,
  PhoneCall,
  QrCode,
  Shapes,
  ShoppingBag,
  TerminalSquare,
} from 'lucide-react';
import ModuleShell from '@/components/delivery/ModuleShell';
import PanelCard from '@/components/delivery/PanelCard';
import { Button } from '@/components/ui/button';
import { useDeliveryHub } from '@/hooks/useDeliveryHub';
import { deliveryFormatting } from '@/services/deliveryHubService';

const exampleCode = `window.chatbotApi.getProdutos()

window.chatbotApi.buscarProduto("coca cola")

window.chatbotApi.getProdutoPorId("123")

window.chatbotApi.getBairrosEntrega()

window.chatbotApi.getTaxaEntrega("Centro")

window.chatbotApi.getHorarioFuncionamento()

window.chatbotApi.getEnderecoLoja()

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

const buildBotUrls = (rawUrl, nonce) => {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return {
      baseUrl: '',
      botQrImageUrl: '',
      botQrPageUrl: '',
      botBairrosUrl: '',
      botConfigUrl: '',
      isQrDirect: false,
    };
  }

  const noTrailingSlash = trimmed.replace(/\/+$/, '');
  const qrRegex = /\/qr\.png(?:\?.*)?$/i;
  const isQrDirect = qrRegex.test(noTrailingSlash);
  const baseUrl = isQrDirect ? noTrailingSlash.replace(qrRegex, '') : noTrailingSlash;
  const qrImageBase = isQrDirect ? noTrailingSlash : `${baseUrl}/qr.png`;
  const botQrImageUrl = qrImageBase.includes('?')
    ? `${qrImageBase}&t=${nonce}`
    : `${qrImageBase}?t=${nonce}`;

  return {
    baseUrl,
    botQrImageUrl,
    botQrPageUrl: `${baseUrl}/qr`,
    botBairrosUrl: `${baseUrl}/bairros`,
    botConfigUrl: `${baseUrl}/config`,
    isQrDirect,
  };
};

const ChatbotApiPage = () => {
  const { chatbotApi, chatbotDefaultResponse, snapshot } = useDeliveryHub();
  const [response, setResponse] = useState(chatbotDefaultResponse);
  const [loadingAction, setLoadingAction] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [botBaseUrl, setBotBaseUrl] = useState(() => {
    return window.localStorage.getItem('fortin_whatsapp_bot_url') || 'http://localhost:3333';
  });
  const [botQrNonce, setBotQrNonce] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('');
  const [botBairrosTotal, setBotBairrosTotal] = useState(null);
  const [botOnline, setBotOnline] = useState(null);
  const [botQrError, setBotQrError] = useState(false);

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

  const bairrosAtendidos = snapshot.settings?.bairros || [];
  const appInfo = snapshot.settings?.appInfo || {};

  const menuText = useMemo(
    () =>
      [
        'Menu rapido:',
        '1. Taxa de entrega',
        '2. Bairros atendidos',
        '3. Horario de funcionamento',
        '4. Endereco fisico da loja',
        '5. Falar com atendente',
        'Responda com o numero ou o nome da opcao.',
      ].join('\n'),
    [],
  );

  useEffect(() => {
    setMessages((current) =>
      current.length === 0
        ? [
            {
              id: 'bot-menu',
              role: 'bot',
              content: menuText,
              createdAt: new Date().toISOString(),
            },
          ]
        : current,
    );
  }, [menuText]);

  useEffect(() => {
    window.localStorage.setItem('fortin_whatsapp_bot_url', botBaseUrl);
  }, [botBaseUrl]);

  const { baseUrl: normalizedBotBaseUrl, botQrImageUrl, botQrPageUrl, botBairrosUrl, botConfigUrl } =
    useMemo(() => buildBotUrls(botBaseUrl, botQrNonce), [botBaseUrl, botQrNonce]);
  const isMixedContent =
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    botQrImageUrl.startsWith('http://');

  const fetchBotBairros = async () => {
    const response = await fetch(botBairrosUrl);
    if (!response.ok) {
      throw new Error(`Falha ao ler bairros (${response.status}).`);
    }
    const data = await response.json();
    if (Array.isArray(data?.bairros)) {
      setBotBairrosTotal(data.bairros.length);
    }
    if (typeof data?.status === 'string') {
      setBotOnline(data.status !== 'aguardando_qr');
    }
  };

  const handleSyncBairros = async () => {
    try {
      setSyncStatus('Sincronizando bairros...');
      const bairros = snapshot.settings?.bairros || [];
      const response = await fetch(botBairrosUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bairros }),
      });

      if (!response.ok) {
        throw new Error(`Falha na sincronizacao (${response.status}).`);
      }

      setSyncStatus(`Bairros sincronizados: ${bairros.length}.`);
      await fetchBotBairros();
    } catch (error) {
      setSyncStatus(error.message || 'Falha ao sincronizar bairros.');
    }
  };

  const handleSyncConfig = async () => {
    try {
      setSyncStatus('Sincronizando horario e endereco...');
      const appInfo = snapshot.settings?.appInfo || {};
      const response = await fetch(botConfigUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horarioFuncionamento: appInfo.horarioFuncionamento || '',
          enderecoLoja: appInfo.enderecoLoja || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha na sincronizacao (${response.status}).`);
      }

      setSyncStatus('Horario e endereco sincronizados.');
    } catch (error) {
      setSyncStatus(error.message || 'Falha ao sincronizar configuracoes.');
    }
  };

  useEffect(() => {
    if (!normalizedBotBaseUrl) return;
    handleSyncBairros();
  }, [normalizedBotBaseUrl, snapshot.settings?.bairros?.length]);

  useEffect(() => {
    if (!normalizedBotBaseUrl) return;
    fetchBotBairros().catch(() => {});
  }, [normalizedBotBaseUrl, botQrNonce]);

  useEffect(() => {
    setBotQrError(false);
  }, [botQrImageUrl]);

  const normalizeText = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const formatBairros = (items) => {
    if (!items.length) return 'Nenhum bairro cadastrado no painel.';
    return items
      .map(
        (bairro) =>
          `- ${bairro.nome} | Taxa: ${deliveryFormatting.formatCurrency(bairro.taxaEntrega)} | Tempo: ${bairro.tempoMedio}`,
      )
      .join('\n');
  };

  const buildBotReply = (text) => {
    const normalized = normalizeText(text);
    const matchedBairro = bairrosAtendidos.find((bairro) =>
      normalized.includes(normalizeText(bairro.nome)),
    );

    if (!normalized || normalized.includes('menu')) {
      return menuText;
    }

    if (normalized.startsWith('1') || normalized.includes('taxa')) {
      if (matchedBairro) {
        return `Taxa de entrega para ${matchedBairro.nome}: ${deliveryFormatting.formatCurrency(
          matchedBairro.taxaEntrega,
        )}.`;
      }
      return ['Taxas por bairro:', formatBairros(bairrosAtendidos)].join('\n');
    }

    if (normalized.startsWith('2') || normalized.includes('bairro')) {
      return ['Bairros atendidos:', formatBairros(bairrosAtendidos)].join('\n');
    }

    if (normalized.startsWith('3') || normalized.includes('horario') || normalized.includes('funcionamento')) {
      return appInfo.horarioFuncionamento
        ? `Horario de funcionamento: ${appInfo.horarioFuncionamento}.`
        : 'Horario de funcionamento nao configurado.';
    }

    if (normalized.startsWith('4') || normalized.includes('endereco')) {
      return appInfo.enderecoLoja
        ? `Endereco fisico da loja: ${appInfo.enderecoLoja}.`
        : 'Endereco da loja nao configurado.';
    }

    if (normalized.startsWith('5') || normalized.includes('atendente') || normalized.includes('humano')) {
      return 'Um atendente vai falar com voce. Envie seu nome e telefone para agilizar.';
    }

    return ['Nao entendi sua mensagem.', menuText].join('\n');
  };

  const pushMessage = (role, content) => {
    setMessages((current) => [
      ...current,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = (value) => {
    const text = String(value ?? messageInput).trim();
    if (!text) return;
    pushMessage('user', text);
    setMessageInput('');
    const reply = buildBotReply(text);
    pushMessage('bot', reply);
  };

  const menuActions = [
    { key: 'menu', label: 'Menu', icon: MessageSquare },
    { key: 'taxa', label: 'Taxa de entrega', icon: Bot },
    { key: 'bairros', label: 'Bairros atendidos', icon: MapPin },
    { key: 'horario', label: 'Horario', icon: Clock },
    { key: 'endereco', label: 'Endereco da loja', icon: MapPin },
    { key: 'atendente', label: 'Falar com atendente', icon: PhoneCall },
  ];

  const handleQuickMessage = (key) => {
    switch (key) {
      case 'menu':
        handleSendMessage('menu');
        break;
      case 'taxa':
        handleSendMessage('taxa de entrega');
        break;
      case 'bairros':
        handleSendMessage('bairros atendidos');
        break;
      case 'horario':
        handleSendMessage('horario de funcionamento');
        break;
      case 'endereco':
        handleSendMessage('endereco fisico da loja');
        break;
      case 'atendente':
        handleSendMessage('falar com atendente');
        break;
      default:
        handleSendMessage(key);
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
      key: 'bairros',
      label: 'Listar bairros',
      icon: MapPin,
      action: () => chatbotApi.getBairrosEntrega(),
    },
    {
      key: 'taxa',
      label: 'Taxa por bairro',
      icon: Bot,
      action: () => chatbotApi.getTaxaEntrega(bairrosAtendidos[0]?.nome || ''),
    },
    {
      key: 'horario',
      label: 'Horario de funcionamento',
      icon: Clock,
      action: () => chatbotApi.getHorarioFuncionamento(),
    },
    {
      key: 'endereco',
      label: 'Endereco da loja',
      icon: MapPin,
      action: () => chatbotApi.getEnderecoLoja(),
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard
          title="Agente de IA"
          subtitle="Respostas automaticas integradas ao painel de delivery e personalizacao do app."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {menuActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.key}
                    type="button"
                    onClick={() => handleQuickMessage(action.key)}
                    className="bg-[var(--layout-surface-2)] text-white hover:bg-[var(--layout-border)]"
                  >
                    <Icon className="mr-2 h-4 w-4 text-[var(--layout-accent)]" />
                    {action.label}
                  </Button>
                );
              })}
            </div>

            <div className="min-h-[280px] space-y-3 rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'bg-[var(--layout-accent)] text-white'
                        : 'bg-[var(--layout-surface-2)] text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Digite a mensagem do cliente..."
                className="flex-1 rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-3 text-sm text-white outline-none focus:border-[var(--layout-accent)]"
              />
              <Button
                type="button"
                onClick={() => handleSendMessage()}
                className="bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]"
              >
                Enviar mensagem
              </Button>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Conectar WhatsApp"
          subtitle="Use o QR real do bot WhatsApp (whatsapp-web.js) para autenticar."
        >
          <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--layout-border)] bg-[var(--layout-bg)] p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--layout-surface-2)]">
              <QrCode className="h-6 w-6 text-[var(--layout-accent)]" />
            </div>
            <div className="text-sm text-[var(--layout-text-muted)]">
              Escaneie este QR no WhatsApp Web para conectar.
            </div>
            <div className="w-full rounded-xl border border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4 text-left">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--layout-text-muted)]">
                URL do bot WhatsApp
              </label>
              <input
                value={botBaseUrl}
                onChange={(event) => setBotBaseUrl(event.target.value)}
                placeholder="http://localhost:3333"
                className="w-full rounded-lg border border-[var(--layout-border)] bg-[var(--layout-bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--layout-accent)]"
              />
              <div className="mt-2 text-xs text-[var(--layout-text-muted)]">
                Exemplo: `http://localhost:3333` ou o link completo `http://localhost:3001/qr.png`.
              </div>
            </div>

            <div className="relative h-48 w-48 rounded-xl border border-[var(--layout-border)] bg-white p-2">
              <div className="relative h-full w-full">
                <img
                  src={botQrImageUrl}
                  alt="QR code WhatsApp"
                  className="h-full w-full rounded-lg object-contain"
                  onError={() => setBotQrError(true)}
                  onLoad={() => setBotQrError(false)}
                />
                <img
                  src="/qr-overlay.svg"
                  alt="QR code sobreposto"
                  className="pointer-events-none absolute inset-0 h-full w-full rounded-lg object-contain opacity-0"
                />
              </div>
            </div>
            {botQrError ? (
              <div className="text-xs text-rose-300">
                Nao foi possivel carregar o QR. Verifique se o link responde uma imagem PNG.
              </div>
            ) : null}
            {isMixedContent ? (
              <div className="text-xs text-amber-300">
                Seu painel esta em HTTPS e o QR esta em HTTP. O navegador pode bloquear a imagem.
              </div>
            ) : null}

            <Button
              type="button"
              onClick={() => setBotQrNonce(Date.now())}
              className="bg-[var(--layout-surface-2)] text-white hover:bg-[var(--layout-border)]"
            >
              Atualizar QR code
            </Button>

            <Button
              type="button"
              onClick={() => window.open(botQrPageUrl, '_blank', 'noopener,noreferrer')}
              className="bg-[var(--layout-accent)] text-white hover:bg-[var(--layout-accent-strong)]"
            >
              Abrir painel do QR
            </Button>

            <Button
              type="button"
              onClick={handleSyncBairros}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              Sincronizar bairros agora
            </Button>
            <Button
              type="button"
              onClick={handleSyncConfig}
              className="bg-sky-500 text-white hover:bg-sky-400"
            >
              Sincronizar horario/endereco
            </Button>
            <Button
              type="button"
              onClick={() => fetchBotBairros().catch(() => setBotBairrosTotal(null))}
              className="bg-[var(--layout-surface-2)] text-white hover:bg-[var(--layout-border)]"
            >
              Recarregar bairros do bot
            </Button>
            <div className="text-xs text-[var(--layout-text-muted)]">
              {botBairrosTotal === null
                ? 'Bairros no bot: carregando...'
                : `Bairros no bot: ${botBairrosTotal}`}
            </div>
            <div
              className={`text-xs font-semibold ${
                botOnline === null
                  ? 'text-[var(--layout-text-muted)]'
                  : botOnline
                    ? 'text-emerald-300'
                    : 'text-rose-300'
              }`}
            >
              {botOnline === null
                ? 'Status do bot: verificando...'
                : botOnline
                  ? 'Status do bot: online'
                  : 'Status do bot: offline'}
            </div>
            {syncStatus ? (
              <div className="text-xs text-[var(--layout-text-muted)]">{syncStatus}</div>
            ) : null}
          </div>
        </PanelCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
