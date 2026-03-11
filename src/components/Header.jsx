import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Menu, User, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { playDeliveryAlertSnippet, unlockDeliveryAlertAudio } from '@/utils/deliveryAlertAudio';

const Header = ({ onOpenMobileMenu = () => {} }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [testingAudio, setTestingAudio] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Safe access to user data
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Operador';
  const userEmail = user?.email || '';

  const handleTestDeliverySound = async () => {
    setTestingAudio(true);
    await unlockDeliveryAlertAudio();
    await playDeliveryAlertSnippet(3.2);
    setTimeout(() => setTestingAudio(false), 1200);
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--layout-border)] bg-[var(--layout-bg)] px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="border border-[var(--layout-border)] text-white hover:bg-[var(--layout-surface-2)] md:hidden"
          aria-label="Abrir menu principal"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--layout-accent)] rounded-full animate-pulse"></div>
          <span className="text-xs text-[var(--layout-text-muted)] sm:text-sm">Sistema Online</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <Button
          onClick={handleTestDeliverySound}
          variant="outline"
          size="sm"
          className="bg-transparent border-[#ff7a00]/50 text-[#ffd3a8] hover:bg-[#ff7a00]/10 hover:border-[#ff7a00]"
          aria-label={testingAudio ? 'Tocando som do delivery' : 'Testar som do delivery'}
        >
          <Volume2 className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">{testingAudio ? 'Tocando...' : 'Testar som do delivery'}</span>
        </Button>

        <div className="text-right hidden sm:block">
          <div className="text-sm text-[var(--layout-text-muted)] capitalize">{formatDate(currentTime)}</div>
          <div className="text-lg font-semibold text-white flex items-center justify-end gap-2">
            <Clock className="w-4 h-4 text-[var(--layout-accent)]" />
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="h-10 w-px bg-[var(--layout-border)] hidden sm:block"></div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-[var(--layout-surface-2)] px-3 py-2 md:flex">
            <User className="w-4 h-4 text-[var(--layout-accent)]" />
            <div className="text-sm">
              <div className="text-white font-medium max-w-[150px] truncate">{userName}</div>
              <div className="text-[var(--layout-text-muted)] text-xs max-w-[150px] truncate">{userEmail}</div>
            </div>
          </div>

          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="bg-transparent border-[var(--layout-border)] text-white hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
