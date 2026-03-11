import React, { useEffect, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getDeliveryEventName, readStoredDeliveryOrders } from '@/features/delivery/services/deliveryHubService';
import {
  playDeliveryAlertSnippet,
  stopDeliveryAlertAudio,
  unlockDeliveryAlertAudio,
} from '@/utils/deliveryAlertAudio';

const ALERT_SNIPPET_SECONDS = 3.2;

const DeliveryAlertWatcher = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const notifiedIdsRef = useRef(new Set());
  const alarmIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const stopTimeoutRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  const stopAlertSound = () => {
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    stopDeliveryAlertAudio();
  };

  const unlockAudio = async () => {
    try {
      if (audioUnlockedRef.current) return;
      const unlocked = await unlockDeliveryAlertAudio();
      audioUnlockedRef.current = unlocked;
      setAudioBlocked(!unlocked);
    } catch (error) {
      console.error('Erro ao liberar audio do alerta:', error);
      setAudioBlocked(true);
    }
  };

  const playAlertSound = async () => {
    try {
      stopAlertSound();
      const played = await playDeliveryAlertSnippet(ALERT_SNIPPET_SECONDS);
      if (!played) {
        setAudioBlocked(true);
        return;
      }
      stopTimeoutRef.current = window.setTimeout(() => {
        stopAlertSound();
      }, ALERT_SNIPPET_SECONDS * 1000);
      setAudioBlocked(false);
    } catch (error) {
      console.error('Erro ao tocar alerta de delivery:', error);
      setAudioBlocked(true);
    }
  };

  useEffect(() => {
    if (!user?.id) return undefined;

    const syncOrders = () => {
      const orders = readStoredDeliveryOrders(user.id);
      const pending = orders.filter((order) => order.origem === 'app' && order.status === 'Novo pedido');

      pending.forEach((order) => {
        if (!notifiedIdsRef.current.has(order.id)) {
          notifiedIdsRef.current.add(order.id);
          toast({
            title: 'Novo pedido no delivery',
            description: `Pedido #${order.numero} aguardando aceite da loja.`,
            className: 'bg-[#ff7a00] text-white border-none',
          });
        }
      });

      const pendingIds = new Set(pending.map((order) => order.id));
      notifiedIdsRef.current.forEach((id) => {
        if (!pendingIds.has(id)) {
          notifiedIdsRef.current.delete(id);
        }
      });

      setPendingOrders(pending);
    };

    syncOrders();

    const eventName = getDeliveryEventName();
    window.addEventListener(eventName, syncOrders);
    window.addEventListener('storage', syncOrders);

    return () => {
      window.removeEventListener(eventName, syncOrders);
      window.removeEventListener('storage', syncOrders);
    };
  }, [toast, user]);

  useEffect(() => {
    const tryUnlock = () => {
      unlockAudio();
    };

    window.addEventListener('pointerdown', tryUnlock);
    window.addEventListener('keydown', tryUnlock);
    window.addEventListener('touchstart', tryUnlock);

    return () => {
      window.removeEventListener('pointerdown', tryUnlock);
      window.removeEventListener('keydown', tryUnlock);
      window.removeEventListener('touchstart', tryUnlock);
    };
  }, []);

  useEffect(() => {
    if (pendingOrders.length > 0) {
      playAlertSound();
      if (!alarmIntervalRef.current) {
        alarmIntervalRef.current = window.setInterval(() => {
          playAlertSound();
        }, 5000);
      }
    } else {
      if (alarmIntervalRef.current) {
        window.clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      stopAlertSound();
    }

    return () => {
      if (alarmIntervalRef.current && pendingOrders.length === 0) {
        window.clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [pendingOrders]);

  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) {
        window.clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      stopAlertSound();
    };
  }, []);

  if (pendingOrders.length === 0) return null;

  return (
    <div className="border-b border-[#ff7a00]/40 bg-[#ff7a00]/15 px-6 py-3">
      <div className="flex items-center gap-3 text-[#ffd3a8]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/30">
          <BellRing className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#ffb668]">
            Novo pedido no delivery
          </div>
          <div className="text-sm text-white">
            {pendingOrders.length} pedido(s) aguardando aceite. O alarme para quando o pedido for aceito.
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/painel-loja?tab=pedidos')}
          className="ml-auto rounded-xl border border-[#ffb668]/40 bg-[#ff7a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff8b1f]"
        >
          Ir para Pedidos
        </button>
        {audioBlocked ? (
          <button
            onClick={unlockAudio}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Ativar som
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default DeliveryAlertWatcher;
