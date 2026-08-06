import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, CheckCircle2, Info, AlertTriangle, Gift, Receipt, Tag,
  CheckCheck, ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDateTime } from '../lib/utils';

const ICON_MAP: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-500/20' },
  success: { icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-100 dark:bg-success-500/20' },
  warning: { icon: AlertTriangle, color: 'text-warning-500', bg: 'bg-warning-100 dark:bg-warning-500/20' },
  transaction: { icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
  cashback: { icon: Gift, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  promo: { icon: Tag, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/20' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('phone', user.phone).order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('phone', user.phone).eq('is_read', false);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Notifications" subtitle="Stay updated with your account" back={false} />

      {unreadCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Button variant="secondary" size="sm" onClick={markAllRead} className="w-full">
            <CheckCheck className="w-4 h-4" /> Mark all as read ({unreadCount})
          </Button>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium">No notifications yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">You'll see updates here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n, i) => {
            const cfg = ICON_MAP[n.type] || ICON_MAP.info;
            const Icon = cfg.icon;
            return (
              <AnimatedCard key={n.id} delay={i * 0.03}>
                <button
                  onClick={() => { if (!n.is_read) markRead(n.id); if (n.type === 'transaction') navigate('/transactions'); }}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${n.is_read ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-primary-50/50 dark:bg-primary-500/5 border-primary-100 dark:border-primary-500/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1">{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(n.created_at)}</p>
                      {n.type === 'transaction' && <ChevronRight className="w-3 h-3 text-slate-400" />}
                    </div>
                  </div>
                </button>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
