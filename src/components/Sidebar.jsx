import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sidebarMenuItems } from '@/components/sidebarMenuItems';

const SidebarContent = ({ location, onNavigate, mobile = false }) => (
  <>
    <div className="border-b border-[var(--layout-border)] p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--layout-surface-2)]">
            <img src="/pedidoflow.png" alt="PedidoFlow" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">PedidoFlow</h1>
            <p className="text-xs font-medium text-[var(--layout-text-muted)]">Gestao Comercial</p>
          </div>
        </div>

        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNavigate}
            className="text-[var(--layout-text-muted)] hover:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
    </div>

    <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
      {sidebarMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
              isActive
                ? 'bg-[var(--layout-accent)] text-white shadow-md shadow-black/20'
                : 'text-[var(--layout-text-muted)] hover:bg-[var(--layout-surface-2)] hover:text-white',
            )}
          >
            <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive ? 'scale-105' : '')} />
            <span className="font-medium">{item.label}</span>
            {isActive ? <div className="absolute right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : null}
          </Link>
        );
      })}
    </nav>

    <div className="border-t border-[var(--layout-border)] bg-[var(--layout-surface-2)] p-4">
      <div className="flex items-center justify-between px-2 text-xs text-[var(--layout-text-muted)]">
        <span>Versao 1.0.0</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--layout-accent)]" title="Online" />
          <span>Online</span>
        </div>
      </div>
    </div>
  </>
);

const Sidebar = ({ isMobileOpen = false, onCloseMobileMenu = () => {} }) => {
  const location = useLocation();
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    if (previousPathname.current !== location.pathname && isMobileOpen) {
      onCloseMobileMenu();
    }

    previousPathname.current = location.pathname;
  }, [location.pathname, isMobileOpen, onCloseMobileMenu]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--layout-border)] bg-[var(--layout-bg)] md:flex">
        <SidebarContent location={location} />
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!isMobileOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            isMobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onCloseMobileMenu}
          aria-label="Fechar menu"
        />

        <aside
          className={cn(
            'absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-[var(--layout-border)] bg-[var(--layout-bg)] shadow-2xl transition-transform duration-300 ease-out',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent location={location} onNavigate={onCloseMobileMenu} mobile />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
