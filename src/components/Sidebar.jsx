import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  BarChart3,
  Bike,
  Bot,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Smartphone,
  Store,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/dashboard/pdv', label: 'PDV', icon: ShoppingCart },
    { path: '/dashboard/pessoas', label: 'Pessoas', icon: Users },
    { path: '/dashboard/pessoas/funcionarios', label: 'Funcionários', icon: UserCheck },
    { path: '/dashboard/motoboys', label: 'Motoboys', icon: Bike },
    { path: '/dashboard/vendedores', label: 'Vendedores', icon: UserCheck },
    { path: '/dashboard/produtos', label: 'Produtos', icon: Package },
    { path: '/dashboard/estoque', label: 'Estoque', icon: Archive },
    { path: '/dashboard/contas-pagar', label: 'Contas a Pagar', icon: AlertCircle },
    { path: '/dashboard/contas-receber', label: 'Contas a Receber', icon: CreditCard },
    { path: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
    { path: '/dashboard/relatorios/historico-vendas', label: 'Histórico de Vendas', icon: History },
    { path: '/dashboard/chatbot', label: 'CHATBOT', icon: Bot },
    { path: '/dashboard/painel-loja', label: 'Painel da Loja', icon: LayoutDashboard },
    { path: '/dashboard/app-pedidos', label: 'App de Pedidos', icon: Smartphone },
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-700 bg-[#1a2332] md:flex">
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d084] shadow-lg shadow-[#00d084]/20">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">FORTIN ERP PRO</h1>
            <p className="text-xs font-medium text-gray-400">Gestão Comercial</p>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
                isActive
                  ? 'bg-[#00d084] text-white shadow-md shadow-[#00d084]/20'
                  : 'text-gray-400 hover:bg-[#2a3a4a] hover:text-white',
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive ? 'scale-105' : '')} />
              <span className="font-medium">{item.label}</span>
              {isActive ? <div className="absolute right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 bg-[#151c28] p-4">
        <div className="flex items-center justify-between px-2 text-xs text-gray-500">
          <span>Versão 1.0.0</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#00d084]" title="Online" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
